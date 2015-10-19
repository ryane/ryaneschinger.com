---
draft: true
title: "Introducting AWS Keymaster"
tags:
- devops
- aws
- golang
date: 2015-10-18
url: /blog/aws-keymaster
menu:
  header:
    parent: 'articles'
---

<!-- big aws user -->
<!-- there are a lot of regions -->
<!-- most aws services support regions -->
<!-- each region has its own api endpoint -->
<!-- resources in each region are independent -->
<!-- if you create an ec2 instance in the us-east-1 region, you won't see it in the us-west-2 -->

<!-- key pairs are used to log in to your ec2 instances -->
<!-- when you launch and ec2 instance, you specify a key pair -->
<!-- you must have the private key on the machine you are logging in from -->

<!-- rather than creating a new key pair in each region, amazon allows you to import your own key -->

<!-- this can be a pain if you need to work across regions -->

<!-- https://alestic.com/2010/10/ec2-ssh-keys/ -->

<!-- https://github.com/ryane/aws-keymaster -->
<!-- http://blog.ranman.org/cleaning-up-aws-with-boto3/?utm_content=20552008&utm_medium=social&utm_source=twitter -->

[AWS Keymaster](https://github.com/ryane/aws-keymaster) is a simple utitlity that allows you to import your own personal key pair into all AWS regions with a single command. Distributed as a single binary with no dependencies, AWS Keymaster is easy to deploy and run. It is also available as a [Docker image](https://hub.docker.com/r/ryane/aws-keymaster/).

For example, to import your personal key as a key pair called `mykey`, you just need to run the following command:

{{< highlight shell >}}
aws-keymaster import mykey ~/.ssh/id_rsa.pub
{{< /highlight >}}

That's it. Now your `mykey` key pair exists in all AWS regions.

If you work with AWS across regions, you may find this useful. As someone who works with several different AWS accounts, this has definitely saved me a lot of time. Please let me know if you have any feedback.
