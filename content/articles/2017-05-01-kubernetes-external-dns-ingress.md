---
date: 2017-05-01T21:26:09-04:00
title: Automatic DNS for Kubernetes Ingresses with ExternalDNS
tags:
- kubernetes
- aws
url: /blog/automatic-dns-kubernetes-ingresses-externaldns
menu:
  header:
    parent: 'articles'
optin: "Interested in Kubernetes? Sign up below and I'll share more useful content on topics like this. I won't email you more than once per week and will never share your email address."
optinbutton: "Sign up now!"
---

[ExternalDNS](https://github.com/kubernetes-incubator/external-dns) is a relatively new [Kubernetes Incubator](https://github.com/kubernetes/community/blob/master/incubator.md) project that makes [Ingresses](https://kubernetes.io/docs/concepts/services-networking/ingress/) and [Services](https://kubernetes.io/docs/concepts/services-networking/ingress/) available via DNS. It currently supports AWS [Route 53](https://aws.amazon.com/route53/) and [Google Cloud DNS](https://cloud.google.com/dns/). There are several similar tools available with varying features and capabilities like [route53-kubernetes](https://github.com/wearemolecule/route53-kubernetes), [Mate](https://github.com/zalando-incubator/mate), and the [DNS controller](https://github.com/kubernetes/kops/tree/master/dns-controller) from [Kops](https://github.com/kubernetes/kops). While it is not there yet, the goal is for ExternalDNS to include all of the functionality of the other options by 1.0.

In this post, we will use ExternalDNS to automatically create DNS records for Ingress resources on AWS.

## Deploying the Ingress Controller

An Ingress provides inbound internet access to Kubernetes Services running in your cluster. The Ingress consists of a set of rules, based on host names and paths, that define how requests are routed to a backend Service. In addition to an Ingress resource, there needs to be an [Ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-controllers) running to actually handle the requests. There are several Ingress controller implementations available: [GCE](https://github.com/kubernetes/ingress/tree/master/controllers/gce), [Traefik](https://docs.traefik.io/user-guide/kubernetes/), [HAProxy](https://github.com/rancher/lb-controller), [Rancher](https://github.com/rancher/lb-controller), and even a shiny, brand new [AWS ALB-based controller](https://github.com/coreos/alb-ingress-controller). In this example, we are going to use the [Nginx Ingress controller](https://github.com/kubernetes/ingress/tree/master/controllers/nginx) on AWS.

Deploying the nginx-ingress controller requires creating several Kubernetes resources. First, we need to deploy a default backend server. If a request arrives that does not match any of the Ingress rules, it will be routed to the default backend which will return a 404 response. The `defaultbackend` Deployment will be backed by a [ClusterIP Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services---service-types) that listens on port 80.

The nginx-ingress controller itself requires three Kubernetes resources. The Deployment to run the controller, a ConfigMap to hold the controller's configuration, and a backing Service. Since we are working with AWS, we will deploy a `LoadBalancer` Service. This will create an [Elastic Load Balancer](https://aws.amazon.com/elasticloadbalancing/) in front of the nginx-ingress controller. The architecture looks something like this:

```
     internet
        |
     [ ELB ]
        |
 [ nginx-ingress ]
   --|-----|--
   [ Services ]
```

We will deploy the nginx-ingress controller using the example manifests in the [kubernetes/ingress](https://github.com/kubernetes/ingress/tree/master/examples/aws/nginx) repository.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress/master/examples/aws/nginx/nginx-ingress-controller.yaml
```

{{% note %}}

At the time of this writing, this deploys a beta version (0.9.0-beta.5) of the nginx-ingress controller. The 0.9.x release of the ingress controller is necessary in order to work with ExternalDNS.

{{% /note %}}

Now that we've deployed our Ingress controller, we can move on to our DNS configuration.

ExternalDNS currently requires full access to a single managed zone in Route 53 &mdash; it will delete any records that are not managed by ExternalDNS.

{{% warning %}}

**Warning:** do not use an existing zone containing important DNS records with ExternalDNS. You will lose records.

{{% /warning %}}

If you already have a domain registered in Route 53 that you can dedicate to use for ExternalDNS, feel free to use that. In this post, I will instead show how you can create a subdomain in its own isolated Route 53 hosted zone. I am assuming for the purposes of this post that the parent domain is also hosted in Route 53. However, it is possible to use a subdomain even if the parent domain is [not hosted in Route 53](http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingNewSubdomain.html). In the following examples, I have a domain named `ryaneschinger.com` registered in Route 53 and I will be creating a new hosted zone for `extdns.ryaneschinger.com` dedicated to ExternalDNS.

Here is a small script we can use to configure the zone for our subdomain. Note that it depends on the indispensable [`jq` utility](https://stedolan.github.io/jq/).

```bash
export PARENT_ZONE=ryaneschinger.com
export ZONE=extdns.ryaneschinger.com

# create the hosted zone for the subdomain
aws route53 create-hosted-zone --name ${ZONE} --caller-reference "$ZONE-$(uuidgen)"

# capture the zone ID
export ZONE_ID=$(aws route53 list-hosted-zones | jq -r ".HostedZones[]|select(.Name == \"${ZONE}.\")|.Id")

# create a changeset template
cat >update-zone.template.json <<EOL
{
  "Comment": "Create a subdomain NS record in the parent domain",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "",
      "Type": "NS",
      "TTL": 300,
      "ResourceRecords": []
    }
  }]
}
EOL

# generate the changeset for the parent zone
cat update-zone.template.json \
 | jq ".Changes[].ResourceRecordSet.Name=\"${ZONE}.\"" \
 | jq ".Changes[].ResourceRecordSet.ResourceRecords=$(aws route53 get-hosted-zone --id ${ZONE_ID} | jq ".DelegationSet.NameServers|[{\"Value\": .[]}]")" > update-zone.json

# create a NS record for the subdomain in the parent zone
aws route53 change-resource-record-sets \
  --hosted-zone-id $(aws route53 list-hosted-zones | jq -r ".HostedZones[] | select(.Name==\"$PARENT_ZONE.\") | .Id" | sed 's/\/hostedzone\///') \
  --change-batch file://update-zone.json
```

We are using the AWS CLI to manage our zones in this post but you are probably better off using tools like [Terraform](https://www.terraform.io/) or [CloudFormation](https://aws.amazon.com/cloudformation/) to manage your zones. You can also use the AWS management console if you must.

## IAM Permissions

ExternalDNS will require the necessary IAM permissions to view and manage your hosted zone. There are a few ways you can grant these permissions depending on how you build and manage your Kubernetes installation on AWS. If you are using Kops, you can add [additional IAM policies to your nodes](https://github.com/kubernetes/kops/blob/master/docs/iam_roles.md#adding-additional-policies). If you require finer grained control, take a look at [kube2iam](https://github.com/jtblin/kube2iam). This is the policy I am using for ExternalDNS on my cluster:

```json
[
  {
    "Effect": "Allow",
    "Action": [
      "route53:ChangeResourceRecordSets",
      "route53:ListResourceRecordSets",
      "route53:GetHostedZone"
    ],
    "Resource": [
      "arn:aws:route53:::hostedzone/<hosted-zone-id>"
    ]
  },
  {
    "Effect": "Allow",
    "Action": [
      "route53:GetChange"
    ],
    "Resource": [
      "arn:aws:route53:::change/*"
    ]
  },
  {
    "Effect": "Allow",
    "Action": [
      "route53:ListHostedZones"
    ],
    "Resource": [
      "*"
    ]
  }
]
```

If you are following along, you will need to replace the `<hosted-zone-id>` in the first statement with the correct ID for your zone.

## Deploy ExternalDNS

Here is an example Deployment manifest we can use to deploy ExternalDNS:

<noscript>

```yaml
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: external-dns
spec:
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: external-dns
    spec:
      containers:
      - name: external-dns
        image: registry.opensource.zalan.do/teapot/external-dns:v0.3.0-beta.0
        imagePullPolicy: Always
        args:
        - --domain-filter=$(DOMAIN_FILTER)
        - --source=service
        - --source=ingress
        - --provider=aws
        env:
        - name: DOMAIN_FILTER
          valueFrom:
            configMapKeyRef:
              name: external-dns
              key: domain-filter
```

</noscript>

{{< gist ryane 620adbe00d3666119d3926910ac31046 "external-dns.yml" >}}

A few things to note:

* ExternalDNS is still in beta. We are using `v0.3.0-beta.0` in this example.
* We are running it with both the `service` and `ingress` sources turned on. ExternalDNS can create DNS records for both Services and Ingresses. In this post, we are just working with Ingress resources but ExternalDNS should work with Services as well with this configuration.
* You must tell ExternalDNS which domain to use. This is done with the `--domain-filter` argument. The Deployment is configured to read this domain from a [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configmap/) that we will create in the next step.
* We tell ExternalDNS that we are using Route 53 with the `--provider=aws` argument.

Now we can deploy ExternalDNS. Make sure you change the value of `domain-filter` in the `create configmap` command. And, note that it is important that the domain ends with a ".".

```bash
# create the configmap containing your domain
kubectl create configmap external-dns --from-literal=domain-filter=extdns.ryaneschinger.com.

# deploy ExternalDNS
kubectl apply -f https://gist.githubusercontent.com/ryane/620adbe00d3666119d3926910ac31046/raw/808ca3170ddf6549f39c487658eabe5b6faf9045/external-dns.yml
```

At this point, ExternalDNS should be up, running, and ready to create DNS records from Ingress resources. Let's see this work with the same example used in the [ExternalDNS documentation for GKE](https://github.com/kubernetes-incubator/external-dns/blob/master/docs/tutorials/nginx-ingress.md#deploy-a-sample-application).

<noscript>

```yaml
---

apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: nginx
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: nginx.extdns.ryaneschinger.com
    http:
      paths:
      - backend:
          serviceName: nginx
          servicePort: 80

---

apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: nginx

---

apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx
spec:
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: nginx
        name: nginx
        ports:
        - containerPort: 80
```

</noscript>

{{< gist ryane 620adbe00d3666119d3926910ac31046 "demo.yml" >}}

You can use this manifest almost as-is but you do need to change the `host` rule in the Ingress resources to use your domain. This is what ExternalDNS will use to create the necessary DNS records. Download the file and update it with your domain name:

```bash
curl -SLO https://gist.githubusercontent.com/ryane/620adbe00d3666119d3926910ac31046/raw/c43d0e42f63948c50af672e2899858bc11ecaad3/demo.yml
```

After updating the `host` rule, we can deploy the demo application:

```bash
kubectl apply -f demo.yml
```

After a minute or two, you should see that ExternalDNS populates your zone with an ALIAS record that points to the ELB for the nginx-ingress controller you deployed earlier. You can check the logs to verify that things are working correctly or to troubleshoot if things are not:

```bash
$ kubectl logs -f $(kubectl get po -l app=external-dns -o name)
time="2017-05-04T11:20:39Z" level=info msg="config: &{Master: KubeConfig: Sources:[service ingress] Namespace: FqdnTemplate: Compatibility: Provider:aws GoogleProject: DomainFilter:extdns.ryaneschinger.com. Policy:sync Registry:txt TXTOwnerID:default TXTPrefix: Interval:1m0s Once:false DryRun:false LogFormat:text MetricsAddress::7979 Debug:false}"
time="2017-05-04T11:20:39Z" level=info msg="Connected to cluster at https://100.64.0.1:443"
time="2017-05-04T11:20:39Z" level=info msg="All records are already up to date"
time="2017-05-04T11:21:40Z" level=info msg="Changing records: CREATE {
  Action: "CREATE",
  ResourceRecordSet: {
    AliasTarget: {
      DNSName: "ad8780caf306711e7bea40a080212981-1467976998.us-east-1.elb.amazonaws.com",
      EvaluateTargetHealth: true,
      HostedZoneId: "Z35SXDOTRQ7X7K"
    },
    Name: "nginx.extdns.ryaneschinger.com",
    Type: "A"
  }
} ..."
time="2017-05-04T11:21:40Z" level=info msg="Changing records: CREATE {
  Action: "CREATE",
  ResourceRecordSet: {
    Name: "nginx.extdns.ryaneschinger.com",
    ResourceRecords: [{
        Value: "\"heritage=external-dns,external-dns/owner=default\""
      }],
    TTL: 300,
    Type: "TXT"
  }
} ..."
time="2017-05-04T11:21:40Z" level=info msg="Record in zone extdns.ryaneschinger.com. were successfully updated"
time="2017-05-04T11:22:40Z" level=info msg="All records are already up to date"
time="2017-05-04T11:23:40Z" level=info msg="All records are already up to date"
time="2017-05-04T11:24:40Z" level=info msg="All records are already up to date"
```

Assuming everything worked correctly, and allowing for propagation time, you should now be able to access the demo application through its dynamically created domain name:

```bash
$ curl nginx.extdns.ryaneschinger.com
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html
```

Very nice. In the next post, we will build upon this and generate TLS certificates for our Ingress resources with [Let's Encrypt](https://letsencrypt.org/).
