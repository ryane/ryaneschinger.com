---
date: 2016-06-20
title: "Rolling updates with Kubernetes: Replication Controllers vs Deployments"
tags:
- kubernetes
- docker
url: /blog/rolling-updates-kubernetes-replication-controllers-vs-deployments
menu:
  header:
    parent: 'articles'
optin: "Interested in more content on Kubernetes? Sign up below!"
optinbutton: "I want more!"
---

A rolling update is the process of updating an application &mdash; whether it is
a new version or just updated configuration &mdash; in a serial fashion. By
updating one instance at a time, you are able to keep the application up and
running. If you were to just update all instances at the same time, your
application would likely experience downtime. In addition, performing a rolling
update allows you to catch errors during the process so that you can rollback
before it affects all of your users.

Historically, rolling updates could be performed using Kubernetes
[Replication Controllers](http://kubernetes.io/docs/user-guide/replication-controller/)
and the
[kubectl rolling-update command](http://kubernetes.io/docs/user-guide/rolling-updates/).
In Kubernetes 1.2, the
[Deployment](http://kubernetes.io/docs/user-guide/rolling-updates/) object API
was released in beta. Deployments operate at a higher level than Replication
Controllers and are the preferred mechanism going forward.

We'll look at how to do rolling updates with Kubernetes. First, we'll go through
the process using Replication Controllers. Afterwards, we'll deploy and update
the same application using the newer Deployment API, so that we can see the
advantages that it provides.

## Rolling Updates with a Replication Controller

Let's go over how to do a rolling update using a Replication Controller. To do
so, it is actually necessary to create a new Replication Controller with the
updated configuration. The rolling update process coordinates the increase of
the replica count for the new Replication Controller, while decreasing the
number of replicas for the old Replication Controller. This continues until the
number of replicas in the old Replication Controller reaches 0, and the desired
number of pods are running with the new configuration defined in the new
Replication Controller. Finally, the old replication is deleted from the system.

Let's look at an example. I have a simple Golang service that returns a json
response that includes a timestamp, hostname, the version of the app, and a
value that is retrieved via an environment variable.

{{% note %}}
The source code for our application and all the Kubernetes specs discussed in
this post can be found in the
[k8s-deployment-demo repository on github](https://github.com/ryane/k8s-deployment-demo).
{{% /note %}}

Here is an example of the response:

{{< highlight json >}}
{
  "Environment": "production",
  "Hostname": "radon.local",
  "Time": "2016-06-10T08:50:24.377415946-04:00",
  "Version": "0.1"
}
{{< /highlight >}}

We are going to use this response to monitor the changes to our application when
we update it in Kubernetes. First, we'll deploy the initial version. Below is
our Replication Controller spec (demo-rc-v0.1.yml):

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

This is a pretty straightforward Replication Controller spec. There are just a
few things to note:

* The name of the Replication Controller is: `k8s-deployment-demo-controller-v1`.
* We are deploying 4 instances (`replicas: 4`).
* In the selector, we are using a version label set to `v0.1` which matches the
  label set in the pod template.
* We are deploying the `0.1` tag of the `ryane/k8s-deployment-demo` docker
  image.
* We are setting the value of the `DEMO_ENV` environment variable to `staging`.

Let's deploy it!

{{< highlight bash >}}
kubectl create -f demo-rc-v0.1.yml
{{< /highlight >}}

After a few moments, you should see that the Replication Controller has been
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
[Service](http://kubernetes.io/docs/user-guide/services/), so that we can access
our application while we do the rolling update.

{{< highlight bash >}}
$ kubectl expose rc k8s-deployment-demo-controller-v1 --name=k8s-deployment-demo-svc --port=80 --target-port=8081 --selector="app=k8s-deployment-demo"
service "k8s-deployment-demo-svc" exposed
{{< /highlight >}}

After running the above command, there will be a `k8s-deployment-demo-svc`
Service object with an endpoint for each pod in our Replication Controller:

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
different pods in the Replication Controller. If you're following along, it will
be useful to keep this interactive shell running so that you can interact with
it while we continue.

Now we've decided this application needs to be updated to version 0.2. Let's
see how to do that. Our new Replication Controller spec looks like this:

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
  selector for the Replication Controller has also been updated with that label.
* The tag for the docker image has been updated to 0.2.
* The value for the `DEMO_ENV` environment variable has been updated to
  "production". This is done for the purpose of this demo so that you can easily
  see the value change during the update.

To see all the changes, check out this
[diff](https://gist.github.com/ryane/391de65e7c28f958b2f98ad9bd444513).

Let's perform the update! We will use `kubectl rolling-update` to specify that
we want to update our running `k8s-deployment-demo-controller-v1` Replication
Controller to `k8s-deployment-demo-controller-v2` (the above yaml is saved in a
file called `demo-rc-v02.yml`).

{{< highlight bash >}}
$ kubectl rolling-update k8s-deployment-demo-controller-v1 --update-period=10s -f demo-rc-v0.2.yml
{{< /highlight >}}

We are using most of the default options, but we are specifying an update period
of 10 seconds. This is the amount of time to wait between updating each pod in
the Replication Controller. The default is 1 minute, but we want it to run a bit
faster for this demo application.

While the update is running, you can use the curl job prompt we started above to
monitor the process. Here is a sample of what the requests looked like on my
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

That's it! Now 4 instances of version 0.2 of our application are running in our
cluster. The upgrade process completed without any interruption of service to
the consumers of the application. This is a powerful capability.

However, there are some drawbacks to this approach. As mentioned above, to
perform the update it is necessary to create a new Replication Controller with a
new name. If you store your Kubernetes manifests in source control, you need to
bounce between at least two manifests to coordinate between releases. Also, the
rolling update occurs on the client side via `kubectl`. This means the rolling
update is more vulnerable to network interruptions. Also, rolling back is not as
simple as it could be. Rollbacks require running another rolling update back to
another Replication Controller with the previous configuration. And, finally,
there is no audit trail with this approach &mdash; the deployment history is not
tracked anywhere within Kubernetes.

{{% note %}}
There is a bit of a shortcut if you are running a single container pod
and are only updating the docker image of that container. Instead of creating a
new Replication Controller manifest, you can simply run a command like this:

{{< highlight bash >}}
kubectl rolling-update k8s-deployment-demo-controller-v1 --image=ryane/k8s-deployment-demo:0.2
{{< /highlight >}}

Behind the scenes, this will create a new Replication Controller with a
temporary name. Once the update is complete, it will delete the original
Replication Controller and update the new Replication Controller with the name
of the original one. This certainly simplifies the process, but it is often not
usable for many applications since you will often be running pods with multiple
containers or will need to update more than just the docker image &mdash;
configuration settings, secrets, or volumes, for example.
{{% /note %}}

Now, let's take a look at using the newer Kubernetes Deployment object to
perform the same task.

## Rolling Updates with a Deployment

Before we get started, let's tear down the resources we created above:

{{< highlight bash >}}
$ kubectl delete rc k8s-deployment-demo-controller-v2
$ kubectl delete svc k8s-deployment-demo-svc
{{< /highlight >}}

Now that we have a clean slate, we can use a Deployment to run our application.
Here is our deployment manifest (demo-deployment-v1.yml):

{{< highlight yaml >}}
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: k8s-deployment-demo-deployment
spec:
  replicas: 4
  selector:
    matchLabels:
      app: k8s-deployment-demo
  minReadySeconds: 10
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

This actually looks quite similar to our Replication Controller manifest. There
are just a few differences:

* The kind is `Deployment` instead of `ReplicationController`.
* The selector uses `matchLabels` as the Deployment object supports
  [Set-based label requirements](http://kubernetes.io/docs/user-guide/labels/#resources-that-support-set-based-requirements).
* Note that we are excluding the `version` label in the selector. As we will
  see, the same Deployment object is going to support multiple versions of our
  application.
* We are setting `minReadySeconds` so that there is a 10 second grace period
  after a pod is started and before it is considered ready. This can be used in
  conjunction with a
  [ReadinessProbe](http://kubernetes.io/docs/user-guide/pod-states/) that will
  let your application distinguish between when it is just up and running and
  actually ready to serve requests (perhaps there is an initialization or
  bootstrapping phase for your application). In this case, we don't have a
  ReadinessProbe defined for our pod; we are just using the delay so that we can
  monitor the process of our update. Otherwise, it just happens too fast for us
  to see what is going on!

Now we can run our deployment. As with the Replication Controller, we use
`kubectl create` for this. In this example, we are also using the `--record`
option. This saves the command along with the resource in the Kubernetes API
server. This will be useful when we look at the deployment history later.

{{< highlight bash >}}
$ kubectl create -f demo-deployment-v1.yml --record
deployment "k8s-deployment-demo-deployment" created
{{< /highlight >}}

As with the Replication Controller example, we should see that 4 pods will be
running our application and that our Deployment object is created (it may take a
few moments for Kubernetes to reach the desired state).

{{< highlight bash >}}
$ kubectl get pods
NAME                                              READY     STATUS    RESTARTS   AGE
k8s-deployment-demo-deployment-3774590724-2scro   1/1       Running   0          10s
k8s-deployment-demo-deployment-3774590724-cdtsh   1/1       Running   0          10s
k8s-deployment-demo-deployment-3774590724-dokm9   1/1       Running   0          10s
k8s-deployment-demo-deployment-3774590724-m58pe   1/1       Running   0          10s

$ kubectl get deployment
NAME                             DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
k8s-deployment-demo-deployment   4         4         4            4           5s
{{< /highlight >}}

Under the hood, we also can see that a new object that was created. The
[ReplicaSet](http://kubernetes.io/docs/user-guide/replicasets/).

{{< highlight bash >}}
$ kubectl get replicaset
NAME                                        DESIRED   CURRENT   AGE
k8s-deployment-demo-deployment-3774590724   4         4         3m
{{< /highlight >}}

At this point, ReplicaSets are virtually identical to Replication Controllers.
The major difference is that they support the newer set-based label selectors as
mentioned above. You won't typically need to work with ReplicaSets directly as
the Deployment will manage them for you behind the scenes.

Just like before, we are going to create a Service so that we can access our
application.

{{< highlight bash >}}
$ kubectl expose deployment k8s-deployment-demo-deployment --name=k8s-deployment-demo-svc --port=80 --target-port=8081 --selector="app=k8s-deployment-demo"
{{< /highlight >}}

You can run the curl job &mdash; like we did above &mdash; to monitor the
application while we perform the rolling update:

{{< highlight bash >}}
$ kubectl run curl --image=radial/busyboxplus:curl -i --tty --restart=Never
Waiting for pod default/curl-3x5ma to be running, status is Pending, pod ready: false

Hit enter for command prompt
                            /bin/sh: shopt: not found

[ root@curl-3x5ma:/ ]$ while true; do curl -s k8s-deployment-demo-svc.default.sv
c.cluster.local; sleep 1; done
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-dokm9","Environment":"staging","Time":"2016-06-14T12:54:01.663928214Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-m58pe","Environment":"staging","Time":"2016-06-14T12:54:02.677043164Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-dokm9","Environment":"staging","Time":"2016-06-14T12:54:03.686170751Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-2scro","Environment":"staging","Time":"2016-06-14T12:54:04.691405055Z"}
{{< /highlight >}}

{{% note %}}
If you stopped your curl job from the previous example, you may need to delete
the job first with `kubectl delete job curl` before you can run it again.
{{% /note %}}

Let's prepare our application for version 0.0.2. Below is an updated Deployment
manifest (demo-deployment-v2.yml):

{{< highlight yaml >}}
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: k8s-deployment-demo-deployment
spec:
  replicas: 4
  selector:
    matchLabels:
      app: k8s-deployment-demo
  minReadySeconds: 10
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

{{% note %}}
For the purposes of the demo, I am using two different yaml files for the v1 and
v2 version of the Deployment. This is not necessary; instead, you could just
update the single deployment manifest (ideally committing it into source
control) and apply it.
{{% /note %}}

The only differences between this and the v1 version of the deployments are the
`version` label for the pod template, the change in the container `image` to use
the 0.2 tag, and the value of the `DEMO_ENV` environment variable.

Here is the
[diff](https://gist.github.com/ryane/b9de03bcf8f4912c557a1fe9bf739b76).

Now we can roll out our new version:

{{< highlight bash >}}
$ kubectl apply -f demo-deployment-v2.yml --record
deployment "k8s-deployment-demo-deployment" configured
{{< /highlight >}}

You won't get the output like you saw when you ran `kubectl rolling-update`, but
you can monitor the status of the update using other kubectl commands. Here are
few samples:

{{< highlight bash >}}
$ kc get deployment
NAME                             DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
k8s-deployment-demo-deployment   4         5         4            3           1m

$ kubectl get pods
NAME                                              READY     STATUS        RESTARTS   AGE
k8s-deployment-demo-deployment-129478752-3i3zx    1/1       Running       0          51s
k8s-deployment-demo-deployment-129478752-cgp8k    1/1       Running       0          51s
k8s-deployment-demo-deployment-129478752-oqvqe    1/1       Running       0          19s
k8s-deployment-demo-deployment-129478752-vg5ha    1/1       Running       0          19s
k8s-deployment-demo-deployment-3774590724-1oyko   1/1       Terminating   0          1m
k8s-deployment-demo-deployment-3774590724-4a41o   1/1       Terminating   0          1m
k8s-deployment-demo-deployment-3774590724-ga7ew   1/1       Running       0          1m

$ kubectl describe deployment k8s-deployment-demo-deployment
Name:                   k8s-deployment-demo-deployment
Namespace:              default
CreationTimestamp:      Tue, 14 Jun 2016 10:21:45 -0400
Labels:                 app=k8s-deployment-demo,version=v0.1
Selector:               app=k8s-deployment-demo
Replicas:               4 updated | 4 total | 3 available | 2 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        10
RollingUpdateStrategy:  1 max unavailable, 1 max surge
OldReplicaSets:         k8s-deployment-demo-deployment-3774590724 (1/1 replicas created)
NewReplicaSet:          k8s-deployment-demo-deployment-129478752 (4/4 replicas created)
Events:
  FirstSeen     LastSeen        Count   From                            SubobjectPath   Type            Reason                  Message
  ---------     --------        -----   ----                            -------------   --------        ------                  -------
  3m            3m              1       {deployment-controller }                        Normal          ScalingReplicaSet       Scaled up replica set k8s-deployment-demo-deployment-3774590724 to 4
  20s           20s             1       {deployment-controller }                        Normal          ScalingReplicaSet       Scaled up replica set k8s-deployment-demo-deployment-129478752 to 1
  20s           20s             1       {deployment-controller }                        Normal          ScalingReplicaSet       Scaled down replica set k8s-deployment-demo-deployment-3774590724 to 3
  20s           20s             1       {deployment-controller }                        Normal          ScalingReplicaSet       Scaled up replica set k8s-deployment-demo-deployment-129478752 to 2
  2s            2s              1       {deployment-controller }                        Normal          ScalingReplicaSet       Scaled down replica set k8s-deployment-demo-deployment-3774590724 to 1
  2s            2s              1       {deployment-controller }                        Normal          ScalingReplicaSet       Scaled up replica set k8s-deployment-demo-deployment-129478752 to 4
{{< /highlight >}}

If you're monitoring the output of the curl job, you should not see any
disruption while the update is happening. Both the 0.1 and 0.2 version of the
application will serve requests until the upgrade is completed.

{{< highlight bash >}}
{"Version":"0.2","Hostname":"k8s-deployment-demo-deployment-129478752-vg5ha","Environment":"production","Time":"2016-06-14T13:48:19.608435577Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-ga7ew","Environment":"staging","Time":"2016-06-14T13:48:20.623657093Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-ga7ew","Environment":"staging","Time":"2016-06-14T13:48:21.631715042Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-ga7ew","Environment":"staging","Time":"2016-06-14T13:48:22.63956071Z"}
{"Version":"0.2","Hostname":"k8s-deployment-demo-deployment-129478752-vg5ha","Environment":"production","Time":"2016-06-14T13:48:23.648553098Z"}
{"Version":"0.1","Hostname":"k8s-deployment-demo-deployment-3774590724-ga7ew","Environment":"staging","Time":"2016-06-14T13:48:24.655309069Z"}
{"Version":"0.2","Hostname":"k8s-deployment-demo-deployment-129478752-cgp8k","Environment":"production","Time":"2016-06-14T13:48:25.665096707Z"}
{{< /highlight >}}

As mentioned, one of the benefits of using Deployments is the fact that the
update history is stored in Kubernetes. We can use the `kubectl rollout` command
to view the history:

{{< highlight bash >}}
$ kubectl rollout history deployment k8s-deployment-demo-deployment
deployments "k8s-deployment-demo-deployment":
REVISION        CHANGE-CAUSE
1               kubectl create -f demo-deployment-v1.yml --record
2               kubectl apply -f demo-deployment-v2.yml --record
{{< /highlight >}}

You can also see that the there are now two ReplicaSets that are associated with
our Deployment:

{{< highlight bash >}}
$ kubectl get replicaset
NAME                                        DESIRED   CURRENT   AGE
k8s-deployment-demo-deployment-129478752    4         4         6m
k8s-deployment-demo-deployment-3774590724   0         0         8m
{{< /highlight >}}

With all of this information captured in Kubernetes, it is much simpler to
perform a rollback. As an example, let's rollback to version 0.1 of our
application:

{{< highlight bash >}}
$ kubectl rollout undo deployment k8s-deployment-demo-deployment
deployment "k8s-deployment-demo-deployment" rolled back
{{< /highlight >}}

You can use the various `kubectl` commands described above and the curl job to
monitor the status of the rollback. In less than a minute or so, the application
should be back to 4 pods running the 0.1 version.

As you can see, rolling updates is an important feature in Kubernetes and the
capabilities continue to improve. The new Deployment feature in 1.2+ is an
elegant way to manage your application deployments. I hope this was helpful.
Thanks for reading!

{{% optinform %}}
