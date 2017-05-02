---
date: 2017-05-01T21:26:09-04:00
title: External DNS, Let's Encrypt, and Nginx Ingress on Kubernetes and AWS
tags:
- kubernetes
- aws
url: /blog/kubernetes-external-dns-ingress
menu:
  header:
    parent: 'articles'
optin: "Interested in Kubernetes? Sign up below and I'll share more useful content on topics like this. I won't email you more than once per week and will never share your email address."
optinbutton: "Sign up now!"
---

TODO: add noscript blocks

For every ingress resource we add, we want to have a DNS record registered in Route53 as well as having an SSL certifcate generated.

Automatic DNS registration and SSL certificate generation for


First, we'll deploy the [Nginx Ingress controller]().

An Ingress provides inbound internet access to Kubernetes Services running in your cluster. The Ingress consists of a set of rules, based on host names and paths, that define how requests are routed to a backend Service. In addition to the Ingress resources, there needs to be an [Ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-controllers) running to actually handle the requests. There are several Ingress controller implementations available: [GCE](https://github.com/kubernetes/ingress/tree/master/controllers/gce), [Traefik](https://docs.traefik.io/user-guide/kubernetes/), [HAProxy](https://github.com/rancher/lb-controller), [Rancher](https://github.com/rancher/lb-controller), and more. In this example, we are going to use the [Nginx Ingress controller](https://github.com/kubernetes/ingress/tree/master/controllers/nginx) on AWS.

Deploying the nginx-ingress controller requires creating several Kubernetes resources. First, we need to deploy a default backend server. If a request arrives that does not match any of the Ingress rules, it will be routed to the default backend which will return a 404 response. The `defaultbackend` Deployment will be backed by a [ClusterIP Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services---service-types) that listens on port 80.

{{< gist ryane 01efee9e72d12a9b5c7cac9957a1d488 "defaultbackend.yml" >}}

You can deploy this by running:

```bash
kubectl apply -f https://gist.githubusercontent.com/ryane/01efee9e72d12a9b5c7cac9957a1d488/raw/60334bdcef7ed69b028f2db4e5bdb2ef84aa4e65/defaultbackend.yml
```

The nginx-ingress controller itself requires three Kubernetes resources. The Deployment to run the controller, a ConfigMap to hold the controller's configuration, and a backing Service. Since we are working with AWS, we will deploy a `LoadBalancer` Service. On AWS, this will create an [Elastic Load Balancer]() in front of the nginx-ingress controller. The architecture looks something like this:

```
     internet
        |
     [ ELB ]
        |
 [ nginx-ingress ]
   --|-----|--
   [ Services ]
```

```yaml
---

kind: ConfigMap
apiVersion: v1
metadata:
  name: ingress-nginx
  labels:
    app: ingress-nginx
    component: config
    k8s-addon: ingress-nginx.addons.k8s.io
data:
  use-proxy-protocol: "true"
  enable-vts-status: "false"

---

kind: Service
apiVersion: v1
metadata:
  name: ingress-nginx
  labels:
    app: ingress-nginx
    component: controller
    k8s-addon: ingress-nginx.addons.k8s.io
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-proxy-protocol: '*'
spec:
  type: LoadBalancer
  selector:
    app: ingress-nginx
    component: controller
  ports:
  - name: http
    port: 80
    targetPort: http
  - name: https
    port: 443
    targetPort: https

---

kind: Deployment
apiVersion: extensions/v1beta1
metadata:
  name: ingress-nginx
  labels:
    app: ingress-nginx
    component: controller
    k8s-addon: ingress-nginx.addons.k8s.io
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: ingress-nginx
        component: controller
        k8s-addon: ingress-nginx.addons.k8s.io
    spec:
      terminationGracePeriodSeconds: 60
      containers:
      - image: gcr.io/google_containers/nginx-ingress-controller:0.9.0-beta.5
        name: ingress-nginx
        imagePullPolicy: Always
        ports:
          - name: http
            containerPort: 80
            protocol: TCP
          - name: https
            containerPort: 443
            protocol: TCP
        livenessProbe:
          httpGet:
            path: /healthz
            port: 10254
            scheme: HTTP
          initialDelaySeconds: 30
          timeoutSeconds: 5
        env:
          - name: POD_NAME
            valueFrom:
              fieldRef:
                fieldPath: metadata.name
          - name: POD_NAMESPACE
            valueFrom:
              fieldRef:
                fieldPath: metadata.namespace
        args:
        - /nginx-ingress-controller
        - --default-backend-service=$(POD_NAMESPACE)/nginx-default-backend
        - --configmap=$(POD_NAMESPACE)/ingress-nginx
        - --publish-service=$(POD_NAMESPACE)/ingress-nginx
```
