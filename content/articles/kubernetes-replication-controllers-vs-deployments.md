---
date: 2016-06-09T22:15:34-04:00
title: kubernetes replication controllers vs deployments
tags:
- kubernetes
- docker
url: /blog/kubernetes-replication-controllers-and-deployments
menu:
  header:
    parent: 'articles'
optin: "Interested in more content on Kubernetes? Sign up below!"
optinbutton: "I want more!"
---

The deployment object API was released in beta in Kubernetes 1.2. Deployments
operate at a higher level than replication controllers.

A rolling update is the process of updating pods &mdash; whether it is a new
version or just updated configuration &mdash; in a serial fashion. By updating
one pod at a time, you are able to keep the service up and running. If you were
to just update all pods in a replication controller at the same time, your
application would likely experience downtime.

## Rolling Updates with a Replication Controller

Let's go over how to do a rolling update using a replication controller. To do
so, it actually necessary to create a new replication controller with the
updated configuration. The rolling update process coordinates the increase of
the number of replicas for the new replication controller while decreasing the
number of replicas for the old replication controller. This continues until the
number of replicas in the old replication controller reaches 0 and the desired
number of pods are running with the new configuration defined in the new
replication controller. Finally, the old replication is deleted from the system.

Let's look at an example. I have a simple Golang service that returns a json
response that includes a timestamp, hostname, the version of the app, and a
value that is retrieved via an environment variable. Here is an example of the
response:

{{< highlight json >}}
{
  "Environment": "production",
  "Hostname": "radon.local",
  "Time": "2016-06-10T08:50:24.377415946-04:00",
  "Version": "0.1"
}
{{< /highlight >}}

We are going to use this response to monitor the changes to our service when we
update it in Kubernetes. First, we'll deploy the initial version. Below is our
replication controller:

{{< highlight yaml >}}
apiVersion: v1
kind: ReplicationController
metadata:
  name: k8s-deployment-demo-controller-v1
spec:
  replicas: 4
  selector:
    app: k8s-deployment-demo
    version: v0.1
  template:
    metadata:
      labels:
        app: k8s-deployment-demo
        version: v0.1
    spec:
      containers:
        - name: k8s-deployment-demo
          image: ryane/k8s-deployment-demo:0.1
          imagePullPolicy: Always
          ports:
            - containerPort: 8081
              protocol: TCP
          env:
            - name: DEMO_ENV
              value: staging
{{< /highlight >}}

This is a pretty straightforward replication controller spec. There are just a
few things to note.

* The name of the replication controller is `k8s-deployment-demo-controller-v1`.
* We are deploying 4 instances (`replicas: 4`).
* In the selector, we are using a version label set to `v0.1` which matches the
  label set in the pod template.
* We are deploying the `0.1` tag of the `ryane/k8s-deployment-demo` docker
  image.
* We are setting the value of the `DEMO_ENV` environment variable to `staging`.

Let's deploy it.

{{< highlight bash >}}
kubectl create -f demo-rc-v0.1.yml
{{< /highlight >}}

After a few moments, you should see that the replication controller has been
created and there are 4 pods running:

{{< highlight bash >}}
$ kubectl get rc
NAME                                DESIRED   CURRENT   AGE
k8s-deployment-demo-controller-v1   4         4         1m

$ kubectl get po
NAME                                      READY     STATUS    RESTARTS   AGE
k8s-deployment-demo-controller-v1-0w3ep   1/1       Running   0          30s
k8s-deployment-demo-controller-v1-6nkxi   1/1       Running   0          30s
k8s-deployment-demo-controller-v1-sl5ds   1/1       Running   0          30s
k8s-deployment-demo-controller-v1-z3qsr   1/1       Running   0          30s
{{< /highlight >}}

Next, we are going to create a
[service](http://kubernetes.io/docs/user-guide/services/) so that we can access
our application while we do the rolling update.

{{< highlight bash >}}
$ kubectl expose rc k8s-deployment-demo-controller-v1 --name=k8s-deployment-demo-svc --port=80 --target-port=8081 --selector="app=k8s-deployment-demo"
service "k8s-deployment-demo-svc" exposed
{{< /highlight >}}

After running the above command, there will be a `k8s-deployment-demo-svc`
service object with an endpoint for each pod in our replication controller:

{{< highlight bash >}}
$ kc describe svc k8s-deployment-demo-svc
Name:                   k8s-deployment-demo-svc
Namespace:              default
Labels:                 app=k8s-deployment-demo,version=v0.1
Selector:               app=k8s-deployment-demo,version=v0.1
Type:                   ClusterIP
IP:                     10.0.115.6
Port:                   <unset> 80/TCP
Endpoints:              10.244.0.7:8081,10.244.1.7:8081,10.244.2.8:8081 + 1 more...
Session Affinity:       None
No events.
{{< /highlight >}}

Since we have not exposed our service externally (the
[ClusterIP](http://kubernetes.io/docs/user-guide/services/#publishing-services---service-types)
service type only exposes the service internally), we need to access it from
within the cluster. We'll launch a pod with an interactive shell prompt so that
we can interact with the application.

{{< highlight bash >}}
$ kubectl run curl --image=radial/busyboxplus:curl -i --tty --restart=Never
Waiting for pod default/curl-6aeta to be running, status is Pending, pod ready: false

Hit enter for command prompt
                            /bin/sh: shopt: not found

[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.1","Hostname":"k8s-deployment-demo-controller-v1-krn3r","Environment":"staging","Time":"2016-06-12T13:05:23.947906828Z"}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.1","Hostname":"k8s-deployment-demo-controller-v1-06ifw","Environment":"staging","Time":"2016-06-12T13:05:25.564241985Z"}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.1","Hostname":"k8s-deployment-demo-controller-v1-k63c2","Environment":"staging","Time":"2016-06-12T13:05:28.3038308Z"}
{{< /highlight >}}

This launches a [job](http://kubernetes.io/docs/user-guide/jobs/) running the
`radial/busyboxplus:curl` docker image. We are using the curl utility to make a
request against the DNS name for the service we created in the previous step. In
the above example, you can see our application is returning the version, the
environment setting, a timestamp, and the hostname of the pod is running on. You
should see the hostname changing as the DNS name for the service resolves to the
different pods in the replication controller. If you're following along, it will
be useful to keep this interactive shell running so that you can interact with
it while we continue.

Now, we've decided this application needs to be updated to version 0.2. Let's
see how to do that. Our new replication controller spec looks like this:

{{< highlight yaml >}}
apiVersion: v1
kind: ReplicationController
metadata:
  name: k8s-deployment-demo-controller-v2
spec:
  replicas: 4
  selector:
    app: k8s-deployment-demo
    version: v0.2
  template:
    metadata:
      labels:
        app: k8s-deployment-demo
        version: v0.2
    spec:
      containers:
        - name: k8s-deployment-demo
          image: ryane/k8s-deployment-demo:0.2
          imagePullPolicy: Always
          ports:
            - containerPort: 8081
              protocol: TCP
          env:
            - name: DEMO_ENV
              value: production
{{< /highlight >}}

This is almost identical to the v1 version of the spec. The only differences
are:

* We've changed the name to `k8s-deployment-demo-controller-v2`.
* The `version` label in the pod template has been updated to `v0.2` and the
  selector for the replication controller has also been updated with that label.
* The tag for the docker image has been updated to 0.2.
* The value for the `DEMO_ENV` environment variable has been updated to
  "production". This is done for the purpose of this demo so that you can easily
  see the value change during the update.

Let's perform the update. We will use
`[kubectl rolling-update](http://kubernetes.io/docs/user-guide/kubectl/kubectl_rolling-update/)`
to specify that we want to update our running
`k8s-deployment-demo-controller-v1` replication controller to
`k8s-deployment-demo-controller-v2` (the above yaml saved in a file called
`demo-rc-v02.yml`).

{{< highlight bash >}}
$ kubectl rolling-update k8s-deployment-demo-controller-v1 --update-period=10s -f demo-rc-v0.2.yml
{{< /highlight >}}

We are using most of the default options but we are specifying an update period
of 10 seconds. This is the amount of time to wait between updating the pods in
the replication controller. The default is 1 minute but we want it to run a bit
faster for this demo application.

While the update is running, you can use the curl job prompt we started above to
monitor the process. Here is an example of what the requests looked like on my
system:

{{< highlight bash >}}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.1","Hostname":"k8s-deployment-demo-controller-v1-apw5d","Environment":"staging","Time":"2016-06-12T13:40:35.975460052Z"}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.1","Hostname":"k8s-deployment-demo-controller-v1-9vqyp","Environment":"staging","Time":"2016-06-12T13:40:39.826921421Z"}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.2","Hostname":"k8s-deployment-demo-controller-v2-t3zsa","Environment":"production","Time":"2016-06-12T13:40:40.780995539Z"}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.2","Hostname":"k8s-deployment-demo-controller-v2-t3zsa","Environment":"production","Time":"2016-06-12T13:40:41.931620697Z"}
[ root@curl-6aeta:/ ]$ curl -s k8s-deployment-demo-svc.default.svc.cluster.local
{"Version":"0.1","Hostname":"k8s-deployment-demo-controller-v1-keolo","Environment":"staging","Time":"2016-06-12T13:40:43.426662617Z"}
{{< /highlight >}}

Note how the Version and Environment fields are bouncing between the v0.1 and
v0.2 releases. From the end user perspective, the application stays up and
running the entire time but, while the update is running, both versions may end
up serving requests. By the time the update is complete, you will only have v0.2
pods running.

The `kubectl rolling-update` output explains what is going on during the update:

{{< highlight bash >}}
Created k8s-deployment-demo-controller-v2
Scaling up k8s-deployment-demo-controller-v2 from 0 to 4, scaling down k8s-deployment-demo-controller-v1 from 4 to 0 (keep 4 pods available, don't exceed 5 pods)
Scaling k8s-deployment-demo-controller-v2 up to 1
Scaling k8s-deployment-demo-controller-v1 down to 3
Scaling k8s-deployment-demo-controller-v2 up to 2
Scaling k8s-deployment-demo-controller-v1 down to 2
Scaling k8s-deployment-demo-controller-v2 up to 3
Scaling k8s-deployment-demo-controller-v1 down to 1
Scaling k8s-deployment-demo-controller-v2 up to 4
Scaling k8s-deployment-demo-controller-v1 down to 0
Update succeeded. Deleting k8s-deployment-demo-controller-v1
replicationcontroller "k8s-deployment-demo-controller-v1" rolling updated to "k8s-deployment-demo-controller-v2"
{{< /highlight >}}

That's it. Now, 4 instances of version 0.2 of our application is running in our
cluster. The upgrade process completed without any interruption of service to
the consumers of the application. This is a powerful capability.

However, there are some drawbacks to this approach. As mentioned above, to
perform the update, it is necessary to create a new replication controller with
a new name. If you store your Kubernetes manifests in source control, you need
to bounce between at least two manifests to coordinate between versions. Also,
the rolling update occurs on the client side via `kubectl`. This means the
rolling update is more vulnerable to network interruptions. Also, rolling back
is not as simple as it could be. Rollbacks require running another rolling
update back to another replication controller with the previous configuration.
And, finally, there is no audit trail with this approach &mdash; the deployment
history is not tracked anywhere within Kubernetes.

One note: there is a bit of a shortcut if you are running a single container pod
and are only updating the docker image of that container. Instead of creating a
new replication controller manifest, you can simply run a command like this:

{{< highlight bash >}}
kubectl rolling-update k8s-deployment-demo-controller-v1 --image=ryane/k8s-deployment-demo:0.2
{{< /highlight >}}

Behind the scenes, this will create a new replication controller with a
temporary name. Once the update is complete, it will delete the original
replication controller and update the new replication controller with the name
of the original one. This certainly simplifies the process but it is often not
usable for many applications since you will often be running pods with multiple
containers or will need to update more than just the docker image &mdash;
configuration settings, secrets, or volumes, for example.

Now, let's take a look at using the newer Kubernetes Deployment object to
perform the same task.

## Rolling Updates with a Deployment

Before we get started, let's tear down the resources we created above:

{{< highlight bash >}}
$ kubectl delete rc k8s-deployment-demo-controller-v2
$ kubectl delete svc k8s-deployment-demo-svc
{{< /highlight >}}

Now that we have a clean slate, we can use a Deployment to run our application.
