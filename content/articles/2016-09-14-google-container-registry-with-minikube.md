---
date: 2016-09-14T07:16:01-04:00
title: Using Google Container Registry (GCR) with Minikube
tags:
- kubernetes
- minikube
- gcr
url: /blog/using-google-container-registry-gcr-with-minikube
menu:
  header:
    parent: 'articles'
optin: "Interested in more content on Kubernetes? Sign up below!"
optinbutton: "I want more!"
---

{{% figure src="/images/gcr-minikube-image-pull-failed.png" alt="Image Pull Failed" %}}

Are you using the
[Google Container Registry](https://cloud.google.com/container-registry/) (GCR)
and seeing the dreaded ***ImagePullBackoff*** status on your pods in
[minikube](https://github.com/kubernetes/minikube)? Are you seeing errors in
your pod events like this?

<!--more-->

{{< highlight bash >}}
Warning FailedSync Error syncing pod, skipping: failed to "StartContainer" for "test-app" with ErrImagePull: "image pull failed for gcr.io/test-project/test-app:master.1, this may be because there are no credentials on this request.  details: (Error: Status 403 trying to pull repository test-project/test-app: \"Unable to access the repository: test-project/test-app; please verify that it exists and you have permission to access it (no valid credential was supplied).\")"
{{< /highlight >}}

By default, minikube does not know how to authenticate with GCR. In this post, I
will cover how to configure authentication to GCR in the minikube environment
(or, really, any other non-GCE kubernetes environment).

Kubernetes supports a concept called
[`ImagePullSecrets`](http://kubernetes.io/docs/user-guide/images/#specifying-imagepullsecrets-on-a-pod)
that can be used to set credentials for private docker registries.
`ImagePullSecrets` builds on the more general
[secrets](http://kubernetes.io/docs/user-guide/secrets/) concept in Kubernetes.
The name of the secret you specify for `ImagePullSecrets` should map to a
Kubernetes secret created with the expected registry authentication data. You
can either set `ImagePullSecrets` in individual pod specs or you can configure
it on a
[service account](http://kubernetes.io/docs/user-guide/service-accounts/) in
which case it will apply to all pods associated with that service account. In
this post, I am going to use the service account approach because I want to be
able to use the same
[deployment](http://kubernetes.io/docs/user-guide/deployments/) manifests on
minikube and GKE without alterations.

So how can we create a secret with GCR authentication credentials? There are (at
least) two ways we can do it.

## Use a JSON key file

GCE has its own concept of service accounts. GCE uses service accounts to
authorize applications to access other Google Platform services. In this case,
we want to create a new GCE service account that has access to pull images from
the container registry. Navigate to the "IAM & Admin" section of the
[Google Cloud Console](https://console.cloud.google.com) and select "Service
Accounts". Then click the "Create Service Account" button.

{{% figure src="/images/gcr-minikube-iam.png" alt="GCP IAM & Admin Service Accounts" %}}

We need to provide a name for the service account as well as a role. Since we
just plan to use this account for pulling docker images, we can use the "Viewer"
role.

{{% note %}}
It should also be possible to customize the permissions for the service account
to just give it access to the Google Cloud Storage bucket for the container
registry. See the
[GCP docs](https://cloud.google.com/container-registry/docs/advanced-authentication#using_a_json_key_file)
for more information.
{{% /note %}}

Select the option to "Furnish a new private key" with the "JSON" key type.

{{% figure src="/images/gcr-minikube-service-account-create.png" alt="GCP Create Service Account" %}}

Finally, click "Create" to create the service account. You should be prompted to
download the key file (or your browser will do so automatically). Keep that file
in a safe place as you won't be able to download it again later. We will need it
to create the Kubernetes secret. In the following examples, I am going to
reference this JSON key file as `~/Downloads/gcr-test.json`.

In our minikube environment, we are going to be deploying our app into a
dedicated [namespace](http://kubernetes.io/docs/user-guide/namespaces/) and we
will set `ImagePullSecrets` on the default service account for that namespace.

{{% note %}}
For the remainder of this article, we are going to be targeting a namespace
called dev. If you are following along, you can create this namespace by
running:

{{< highlight bash >}}
$ kubectl create namespace dev
{{< /highlight >}}

{{% /note %}}

We can go ahead and create the Kubernetes secret using the `kubectl create
secret docker-registry` command. The `docker-registry` secret subcommand makes
it easy to create secrets that work with `ImagePullSecrets`.

{{< highlight bash >}}
$ kubectl --namespace=dev create secret docker-registry gcr-json-key \
          --docker-server=https://gcr.io \
          --docker-username=_json_key \
          --docker-password="$(cat ~/Downloads/gcr-test.json)" \
          --docker-email=youremail@example.com
secret "gcr-json-key" created
{{< /highlight >}}

There are a few things to note about this command.

1. We are naming the secret "gcr-json-key". This is the name we will use when we
   configure `ImagePullSecrets` later.
2. The docker username should be "_json_key". It must be named this. Any other
   value will not work.
3. The docker email address can be any valid email address.

At this point, we should be able to update the default service account for the
namespace with `ImagePullSecrets`.

{{< highlight bash >}}
$ kubectl --namespace=dev patch serviceaccount default \
          -p '{"imagePullSecrets": [{"name": "gcr-json-key"}]}'
"default" patched
{{< /highlight >}}

We use the
[`kubectl patch`](http://kubernetes.io/docs/user-guide/kubectl/kubectl_patch/)
command to configure the `ImagePullSecrets` on the default service account with
the name of the secret we just created. Let's verify that it is set correctly:

{{< highlight bash >}}
$ kubectl --namespace=dev get serviceaccount default -o yaml
apiVersion: v1
imagePullSecrets:
- name: gcr-json-key
kind: ServiceAccount
metadata:
  creationTimestamp: 2016-09-13T01:55:45Z
  name: default
  namespace: dev
  resourceVersion: "124"
  selfLink: /api/v1/namespaces/dev/serviceaccounts/default
  uid: 2f737a23-7955-11e6-8007-fa48ea10af3a
secrets:
- name: default-token-xamni
{{< /highlight >}}

Looks good.

Now when we deploy our application, it should be able to pull the image from GCR
(assuming you deploy it into the same namespace that we have been using above).

{{< highlight bash >}}
$ kubectl --namespace=dev apply -f deploy/k8s/deployment.yml
deployment "test-app" created

$ kubectl --namespace=dev get po
NAME                        READY     STATUS              RESTARTS   AGE
test-app-4284596576-73evh   1/1       Running             0          9s
test-app-4284596576-py2cl   0/1       ContainerCreating   0          9s
{{< /highlight >}}

## Using a short-lived access token

The second approach is virtually identical. However, instead of using a GCE
service account, we will generate an access token that can be used to pull
images from the registry. This is a short-lived access token &mdash; it will
only be valid for a short period of time. This method requires the
[gcloud](https://cloud.google.com/sdk/gcloud/) command-line tool so make sure
you have it [installed](https://cloud.google.com/sdk/downloads) and
[configured](https://cloud.google.com/sdk/docs/initializing) if you are
following along.

Let's create the docker-registry secret:

{{< highlight bash >}}
$ kubectl --namespace=dev create secret docker-registry gcr \
          --docker-server=https://gcr.io \
          --docker-username=oauth2accesstoken \
          --docker-password="$(gcloud auth print-access-token)" \
          --docker-email=youremail@example.com
secret "gcr" created
{{< /highlight >}}

This looks very similar to the command we used in the previous example. However,
in this approach we:

1. Use "oauth2accesstoken" as the docker username.
2. Generate the docker "password" by using the output of the `gcloud auth
   print-access-token` command. This command generates and prints a new
   short-lived token.

The rest of the process is the same. As soon as we patch the default service account
with `ImagePullSecrets`, we will be able to pull images from GCR:

{{< highlight bash >}}
$ kubectl --namespace=dev patch serviceaccount default \
          -p '{"imagePullSecrets": [{"name": "gcr"}]}'

$ kubectl --namespace=dev apply -f deploy/k8s/deployment.yml
deployment "test-app" created

$ kubectl --namespace=dev get po
NAME                        READY     STATUS    RESTARTS   AGE
test-app-4284596576-calbd   1/1       Running   0          11s
test-app-4284596576-v7gyn   1/1       Running   0          11s
{{< /highlight >}}

However, it is important to realize that when you use this approach, the
docker-registry secret will only be valid for a few minutes. This means you will
likely need to use a wrapper script to always re-generate the secret before you
deploy new or updated docker images from GCR. This is less convenient but is
arguably a more secure approach than having to maintain and securely store a
long-lived service account key file.

While this article was specific to authenticating to GCR, the same principle
should work for other container registries. I hope it was helpful. Please let me
know if you run into any problems or if you have any more suggestions.

{{% optinform %}}
