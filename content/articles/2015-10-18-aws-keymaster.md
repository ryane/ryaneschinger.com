---
title: "Introducing AWS Keymaster"
tags:
- devops
- aws
- golang
date: 2015-10-18
url: /blog/aws-keymaster
menu:
  header:
    parent: 'articles'
optin: "**Are you interested in automating AWS**? If so sign up below for my newsletter for updates"
optinbutton: "Sign me up!"
---

[AWS Keymaster](https://github.com/ryane/aws-keymaster) is a simple utility that allows you to import your own personal key pair into all AWS regions with a single command. Distributed as a single binary with no dependencies, AWS Keymaster is easy to deploy and run. It is also available as a [Docker image](https://hub.docker.com/r/ryane/aws-keymaster/).

<!--more-->

For example, to import your personal key as a key pair called `mykey`, you just need to run the following command:

{{< highlight bash >}}
aws-keymaster import mykey ~/.ssh/id_rsa.pub
{{< /highlight >}}

That's it. Now your `mykey` key pair exists in all AWS regions.

If you work with AWS across regions, you may find this useful. As someone who works with several different AWS accounts, this has definitely come in handy. You can read more details about how it works and how to use it on [Github](https://github.com/ryane/aws-keymaster). Please let me know if you have any feedback.

<!--  LocalWords:  mykey
 -->

{{< optinform >}}
