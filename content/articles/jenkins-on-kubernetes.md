---
draft: true
title: "Jenkins on Kubernetes"
tags:
- kubernetes
- jenkins
date: 2016-04-19
url: /blog/jenkins-on-kubernetes
menu:
  header:
    parent: 'articles'
optin: "Interested in more content on Kubernetes? Sign up below!"
optinbutton: "I want more!"
---

## Goals

- jenkins on kubernetes
- jenkins slaves are launched on demand by kubernetes infrastructure
- jenkins ui available on an external load balancer
- jenkins ui ssl
- jenkins ui auth
    - how do I do this? an nginx proxy? native Jenkins creds?
- ability to deploy to github
- amazon sns notifications (optional)

## Kubernetes Overview

- deployments?
- pods - a group of containers and volumes that share a network namespace?
- replication controllers - makes sure that the desired number of pods are running
- service
- volume - directory or file available to containers in a pod
- secrets - secret data managed by kubernetes

see quickstart guide or kube 101/201 for more of an overview

## Jenkins Overview

Continuous integration
https://www.reddit.com/r/jenkinsci/comments/4amv0q/im_creating_a_video_series_on_getting_started/

## The Jenkins Leader Dockefile

- config.xml
    - mostly defaults
    - the important bit is the `KubernetesCloud` cloud config
    - note the `ryane/jenkins-jnlp-docker` docker image
    - and the mounting of `/var/run/docker.sock`
    - serverUrl
- executors.groovy
    - turns off executors on the leader node
- plugins.txt
    - important plugins
    - most are defaults but we added (to confirm?)
        - git
        - kubernetes
        - snsnotify
- credentials.xml
    - note the private key files points to a path
        - this will be mounted in a kubernetes secrets volume
- sns.xml
    - optional sns config
    - this will send an SNS notification
- jobs
    - default jobs to import
    - if I don't hardcode the id in credentials.xml, I also have to replace it here

## The Jenkins Slave Dockerfile

- derives from jenkinsci/jnlp-slave
- installs docker and docker-compose
- sudo is also needed in the entrypoint script
- adds the `/var/run/docker.sock` volume
- borrowed ideas and some code from
  https://github.com/jenkinsci/docker/issues/196#issuecomment-180021787
- runs a launch.sh entrypoint that adds the jenkins user to the docker group
    - is this so that sudo is not needed to run docker commands?
    - actually it is due to a docker group permissions mismatch. The gid is not
      predictable across docker hosts. So this script creates the docker group
      using the gid of the sock file and adds the jenkins user to it

- This image is far from optimized and weighs in at a whopping /885.5 MB/. For
  now, I am just running this in my lab and am not going to have more than a
  handful of nodes. I am willing to take the bandwidth hit but you may want to
  find or build a slimmer image.

## Jenkins Leader Controller

## Jenkins Leader Service

## Jenkins Github Deploy Key

```shell
kubectl create secret generic jenkins-github-deploy-key --from-file=ssh-privatekey=/Users/ryan/Downloads/id_rsa --from-file=ssh-publickey=/Users/ryan/Downloads/id_rsa.pub
kubectl get secrets jenkins-github-deploy-key -o yaml
```

## AWS SNS secret

```shell
kubectl create secret generic jenkins-notifier-sns --from-literal=access-key=AKIAJJJTBDU5ZGJK57XA --from-literal=secret-key=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 --from-literal=arn=arn:aws:sns:us-east-1:144207390008:Jenkins
kubectl get secret jenkins-notifier-sns -o yaml
```

## Heroku netrc
kubectl create secret generic heroku-netrc --from-file=./netrc
```

## Future Enhancements

* Jenkins 2.0
