---
title: "AWS CloudFormation vs Terraform"
date: "2015-10-03"
tags:
- aws
- terraform
url: /blog/aws-cloudformation-vs-terraform
menu:
  header:
    parent: 'articles'

---

I am a firm believer in the benefits of programmable and repeatable infrastructure for organizations of all sizes. There are a wide range of tools that are available to help you along this path but I just want to touch on two of them today: [CloudFormation](https://aws.amazon.com/cloudformation/) and [Terraform](https://terraform.io).

Both fall in the programmable infrastructure category. Both are template based-tools used to declaratively define and build infrastructure resources.

CloudFormation is AWS-specific and can be used to provision just about any type of AWS service. Using CloudFormation, you can spin up new EC2 instances, load balancers, S3 buckets, RDS databases and more.

Below is an example of a simple CloudFormation template that provisions a single EC2 instance with SSH access enabled.

{{< highlight json >}}
{
  "Parameters": {
    "KeyName": {
      "Description": "The EC2 Key Pair for SSH access",
      "Type": "AWS::EC2::KeyPair::KeyName"
    }
  },
  "Resources": {
    "CFExampleInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "SecurityGroups": [ { "Ref": "CFSSHAccess" } ],
        "KeyName": { "Ref": "KeyName" },
        "ImageId": "ami-0f4cfd64",
        "InstanceType": "t1.micro"
      }
    },
    "CFSSHAccess": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "SSH access",
        "SecurityGroupIngress": [ {
          "IpProtocol": "tcp",
          "FromPort": "22",
          "ToPort": "22",
          "CidrIp": "0.0.0.0/0"
        } ]
      }
    }
  }
}
{{< /highlight >}}

If you are interested in following along and you have the [AWS CLI](https://aws.amazon.com/cli/) installed and configured, you can create this CloudFormation stack with the following command:

{{< highlight bash >}}
aws cloudformation create-stack --stack-name stackname \
  --template-body file:///path/to/your/cf.json \
  --parameters ParameterKey=KeyName,ParameterValue=keyname
{{< /highlight >}}

{{% note %}}
**Warning:** this and the other commands in this blog post will create AWS resources that may cost you money. Behave accordingly.
{{% /note %}}

To delete the stack (and the corresponding AWS Resources), you can run this:

{{< highlight bash >}}
aws cloudformation delete-stack --stack-name stackname
{{< /highlight >}}

Terraform is developed by the [Hashicorp](https://www.hashicorp.com) team and is a cloud-agnostic tool which enables the provisioning of hybrid-cloud infrastructures with a single tool. For example, maybe you want to use [CloudFlare DNS](https://www.cloudflare.com/dns) along with an AWS infrastructure &mdash; Terraform will allow you to provision both in the same template with the same tool.

Below is an equivalent example modeled in Terraform:

{{< highlight go >}}
variable "key_name" {}

resource "aws_instance" "TFExampleInstance" {
  ami = "ami-0f4cfd64"
  instance_type = "t1.micro"
  key_name = "${var.key_name}"
  security_groups = [ "${aws_security_group.TFSSHAccess.name}" ]
}

resource "aws_security_group" "TFSSHAccess" {
  name = "TFSSHAccess"
  description = "SSH access"

  ingress {
    protocol = "tcp"
    from_port = 22
    to_port = 22
    cidr_blocks = ["0.0.0.0/0"]
  }
}
{{< /highlight >}}

Assuming you have Terraform [installed](https://terraform.io/intro/getting-started/install.html) and [configured for AWS](https://terraform.io/docs/providers/aws/index.html), you can run the following command (in the directory with your `.tf` file) to spin up the EC2 instance:

{{< highlight bash >}}
terraform apply -var 'key_name=keyname'
{{< /highlight >}}

To tear down the environment, you can run:

{{< highlight bash >}}
terraform destroy -var 'key_name=keyname' -force
{{< /highlight >}}

Let's talk about each tool in a little more detail.

## CloudFormation

As mentioned above, CloudFormation is AWS-specific &mdash; you cannot use it to provision infrastructure on any other cloud providers. However, the AWS coverage is extensive. Nearly every service and resource you can create in AWS can be modeled in CloudFormation.

AWS CloudFormation templates are authored in JSON. This is helpful for version-control but they can quickly become difficult to read and maintain, especially as environments get larger and more complex. 

CloudFormation can also be a little difficult to reason about when it comes to applying updates to your environment. Due to tangled dependencies and lack of idempotence for some operations, it is surprisingly easy to update a template that destroys or updates stack resources unexpectedly. The only way to really be sure that the changes you define in your template are going to do what you expect is to update the stack of a running environment. Of course, doing this against production without testing it first is a recipe for disaster. But even testing is not 100% foolproof since it requires that your test environment is in the exact same state as production before you run the updated stack. This can be a challenge in some organizations that are constrained by costs or are just getting started with programmable infrastructure. Amazon does provide some tools to mitigate the risk of unintentional changes to your resources with [stack policies](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/protect-stack-resources.html) but the process is still inherently nerve-wracking.

## Terraform 

Terraform is similar in concept to CloudFormation &mdash; it lets you declaratively define your infrastructure in a versioned template file. One of the biggest advantages it has over CloudFormation, however, is that it is cloud-agnostic. It ships with providers for lots of different services including [AWS](https://terraform.io/docs/providers/aws/index.html), [Google Cloud](https://terraform.io/docs/providers/google/index.html), [Openstack](https://terraform.io/docs/providers/openstack/index.html), [CloudFlare](https://terraform.io/docs/providers/cloudflare/index.html), [DNSimple](https://terraform.io/docs/providers/dnsimple/index.html), and more. If your particular provider is not supported, it is possible to write your [own custom plugin](https://terraform.io/docs/plugins/index.html) in [Go](https://golang.org).

Another advantage of Terraform is its separate planning step. Running `terraform plan` generates an execution plan that will show exactly what Terraform will do when you apply the template to your infrastructure and in what order. This makes it much easier to reason about changes to your infrastructure. You can even generate a visual [graph](https://terraform.io/docs/commands/graph.html) of your Terraform-managed infrastructure. Compared to CloudFormation, you can be much more confident that you won't inadvertently destroy critical infrastructure resources. 

Terraform uses [HCL (HashiCorp Configuration Language)](https://github.com/hashicorp/hcl) as its template language. Some people may be reluctant to adopt another proprietary configuration language but, in practice, HCL is readable and easy to work with. HCL is compatible with JSON and, if desired, you can write your Terraform templates in JSON.

Terraform has reasonably good coverage of the AWS service surface area. However, there are gaps so you may find that Terraform doesn't completely support the provisioning of some of your AWS services. It is open source and under active development so the coverage is improving all of the time.

## Summary

Both CloudFormation and Terraform are nice tools that make it easier to take advantage of programmable infrastructure. I tend to reach for Terraform first when starting new projects as I appreciate the planning features and often have non-AWS components in my environment. It is also a little more pleasant writing Terraform templates than wrangling pure JSON with CloudFormation. If you are all-in on AWS or if Terraform does not (yet) have the AWS support you need, CloudFormation is a good way to go.
