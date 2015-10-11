---
title: "Waiting on EC2 Resources"
tags:
- devops
- aws
date: 2015-10-11
url: /blog/waiting-on-ec2-resources
menu:
  header:
    parent: 'articles'
---

When using the [AWS CLI](https://aws.amazon.com/cli/), did you know you could run a command that waits for a specific resource or condition to occur before moving on to the next? For example, you might want to write a script that starts an EC2 instance and then, only after it is up and running, perform an additional task. Without the `aws ec2 wait` command, this could be a bit of a challenge involving a loop and some polling for the state. However, this is actually kind of trivial with the `wait` command at our disposal.

{{% figure src="/images/aws-wait-instance-running.png" alt="EC2 Wait Instance-Running" %}}

<!--more-->

For some of my development work, I keep around an EC2 instance that has some of the tools and applications I need installed. However, I don't need to have it running all the time &mdash; just when I am working with it. Here is a little snippet from a script I use to start that instance:

{{< highlight bash >}}
instance_id=$(terraform output instance-id)
echo "starting $instance_id..."
aws ec2 start-instances --instance-ids $instance_id
aws ec2 wait instance-running --instance-ids $instance_id
echo "applying terraform configuration..."
terraform apply
echo "started."
{{< /highlight >}}

I use [Terraform](https://terraform.io/) to provision the instance and associated resources. In this case, there is an associated [Route 53](https://aws.amazon.com/route53/) DNS A record that I like to update with the instance's public IP address. I want to wait for the instance to start so that Terraform can grab an accurate IP and update the DNS record.

You can see that after I call `aws ec2 start-instances`, I then run a wait command.

{{< highlight bash >}}
aws ec2 wait instance-running --instance-ids $instance_id
{{< /highlight >}}

In this case, I am waiting for the `instance-running` condition. The command will block until the EC2 instance reaches that state. Once it does, the script will resume.

There are a variety of conditions you can wait on. Many of the various `aws` commands have `wait` subcommands. You can get the list of conditions you can wait on by looking at the help for that command. For example, `aws ec2 wait help` or `aws rds wait help`.

If you are working a lot with the AWS CLI, you will quickly find the `wait` command invaluable and wonder how you managed without it.
