---
date: 2017-03-05T08:02:37-05:00
title: Deploy Kubernetes in an Existing AWS VPC with Kops and Terraform
tags:
- terraform
- kubernetes
- aws
url: /blog/kubernetes-aws-vpc-kops-terraform
menu:
  header:
    parent: 'articles'
optin: "Interested in Kubernetes? Sign up below and I'll share more useful content on topics like this. I won't email you more than once per week and will never share your email address."
optinbutton: "Sign up now!"
---

{{% figure src="/images/kube-kops-terraform.png" alt="Kubernetes Visualization via Weave Scope" %}}

[Kops](https://github.com/kubernetes/kops) is a relatively new tool that can be
used to deploy production-ready [Kubernetes](https://kubernetes.io/) clusters on
AWS. It has the ability to create a highly-available cluster spanning multiple
availability zones and supports a private networking topology. By default, Kops
will create all of the required resources on AWS for you &mdash;
the [EC2](https://aws.amazon.com/ec2/) instances,
the [VPC](https://aws.amazon.com/vpc/) and subnets, the required DNS entries
in [Route53](https://aws.amazon.com/route53/),
the [load balancers](https://aws.amazon.com/elasticloadbalancing/) for exposing
the Kubernetes API, and all of the other necessary infrastructure components.

For organizations that use Terraform, Kops can instead be used to generate
a
[Terraform](https://www.terraform.io/) [configuration](https://github.com/kubernetes/kops/blob/master/docs/terraform.md) for
all of the aforementioned AWS resources. This will allow them to use the
familiar `terraform plan` and `terraform apply` workflow to build and update
their Kubernetes infrastructure. The Terraform configuration that Kops generates
will include new VPC, subnet, and route resources.

But what if you want to use Kops to generate a Terraform configuration for a
Kubernetes cluster in an existing VPC? In this post, I will walk through the
process to achieve this.

<!--more-->

{{% note %}}

In order to follow along with this post, you will need a domain name that you
can register in Route53. We will create the hosted zone as part of our initial
Terraform configuration later in this post.

{{% /note %}}

## Create a VPC with Terraform

To simulate this process, we need an existing VPC infrastructure to work with.
In the [repository](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform)
associated with this post, I have some Terraform modules that will let us easily
create
a
[VPC](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/tree/master/modules/vpc) with
public /
private
[subnet pairs](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/tree/master/modules/subnet-pair) across
multiple availability zones. It will also
create
[NAT gateways](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-nat-gateway.html) to
allow outbound internet traffic for instances on the private subnets.

Let's create this infrastructure. Go ahead and clone the repository.

```bash
git clone https://github.com/ryane/kubernetes-aws-vpc-kops-terraform.git
```

Before we run `terraform apply`, we need to configure some variables.
In
[**variables.tf**](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/blob/master/variables.tf),
you need to set the `name` variable. It is used in several places in our
configuration and should be set to the domain name you are going to be using for
this cluster. You can either modify the **variables.tf** file directly or use
one of the supported mechanisms
to
[assign Terraform variables](https://www.terraform.io/intro/getting-started/variables.html#assigning-variables).

Optionally, you can configure the `region` and availability zone
variables. By default, we are going to be creating a highly available cluster
with Kubernetes masters in *us-east-1a*, *us-east-1c*, *us-east-1d*. You can
also configure the `env` and `vpc_cidr` variables, if desired.

{{% note %}}

**Tip**: to get the list of availability zones for your desired region, you can
run `aws ec2 describe-availability-zones --region us-east-1`. Just replace
*us-east-1* with the region you are using.

{{% /note %}}

Let's take a look
at
[**main.tf**](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/blob/master/main.tf).
Here is how we define our VPC:

<noscript>

```
module "vpc" {
  source   = "./modules/vpc"
  name     = "${var.name}"
  env      = "${var.env}"
  vpc_cidr = "${var.vpc_cidr}"

  tags {
    Infra             = "${var.name}"
    Environment       = "${var.env}"
    Terraformed       = "true"
    KubernetesCluster = "${var.env}.${var.name}"
  }
}

module "subnet_pair" {
  source              = "./modules/subnet-pair"
  name                = "${var.name}"
  env                 = "${var.env}"
  vpc_id              = "${module.vpc.vpc_id}"
  vpc_cidr            = "${module.vpc.cidr_block}"
  internet_gateway_id = "${module.vpc.internet_gateway_id}"
  availability_zones  = "${var.azs}"

  tags {
    Infra             = "${var.name}"
    Environment       = "${var.env}"
    Terraformed       = "true"
    KubernetesCluster = "${var.env}.${var.name}"
  }
}
```

</noscript>

{{< gist ryane 2e27124cc68340a550e39d8cd93ea0d5 "main-vpc.tf" >}}

Most of the heavy lifting is done in the *vpc* and *subnet-pair* modules. Those
modules are responsible for creating the VPC, private and public subnets, NAT
Gateways, routes, and security groups. One thing to note is the
*KubernetesCluster* tag that we are setting on our resources. This tag is
required by some of
the
[Kubernetes AWS integration](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/aws_under_the_hood.md#tagging) features
(such as creating
a
[*LoadBalancer* service](https://kubernetes.io/docs/user-guide/services/#type-loadbalancer) that
is backed by an ELB). If you are installing Kubernetes in your own existing VPC
and want to take advantage of the Kubernetes AWS integration, you'll need to
ensure that this tag is added to your resources.

Besides the networking infrastructure, we also need to create the hosted zone
for our cluster domain name in Route53. If you are following along and already
have your domain name registered in Route53, you can remove this resource from
your local configuration.

<noscript>

```
resource "aws_route53_zone" "public" {
  name          = "${var.name}"
  force_destroy = true
  ...
}
```

</noscript>

{{< gist ryane 2e27124cc68340a550e39d8cd93ea0d5 "main-zone.tf" >}}

Finally, Kops also requires an S3 bucket for storing
the
[state](https://github.com/kubernetes/kops/blob/master/docs/aws.md#cluster-state-storage) of
the cluster. We create this bucket as part of our Terraform configuration:

<noscript>

```
resource "aws_s3_bucket" "state_store" {
  bucket        = "${var.name}-state"
  acl           = "private"
  force_destroy = true

  versioning {
    enabled = true
  }
  ...
}
```

</noscript>

{{< gist ryane 2e27124cc68340a550e39d8cd93ea0d5 "main-state.tf" >}}

Let's go ahead and create our infrastructure. You will need to provide
credentials for an IAM user that has sufficient privileges to create all of
these resources. For simplicity, I am using a user that has the following
policies associated:

* AmazonEC2FullAccess
* IAMFullAccess
* AmazonS3FullAccess
* AmazonVPCFullAccess
* AmazonRoute53FullAccess


{{% warning %}}

**Warning:** Running `terraform apply` and the subsequent commands in this post
will create AWS resources that you will be charged for.

{{% /warning %}}

```bash
export AWS_ACCESS_KEY_ID=<access key>
export AWS_SECRET_ACCESS_KEY=<secret key>

terraform get
terraform apply
```

The apply may take a few minutes but when it's done, you should have a new VPC
and associated resources in your AWS account.

## Deploy Kubernetes with Kops and Terraform

At this point, we have our base AWS infrastructure up and running. Now, we can
move on to using Kops to generate the Terraform for our Kubernetes cluster.

{{% note %}}

Make sure you
have [installed Kops ](https://github.com/kubernetes/kops#installing)
and [kubectl](https://kubernetes.io/docs/user-guide/prereqs/) before proceeding.

{{% /note %}}

First, we should export a few environment variables that we will be using in our
Kops commands.

```bash
export NAME=$(terraform output cluster_name)
export KOPS_STATE_STORE=$(terraform output state_store)
export ZONES=us-east-1a,us-east-1c,us-east-1d
```

The *$NAME* and *$KOPS_STATE_STORE* variables are populated by our Terraform
outputs. *$NAME* should be set to `<env>.<yourdomain.com>` and *$KOPS_STATE_STORE*
should be `s3://<yourdomain.com>-state`.

```bash
$ echo $NAME
staging.example.com

$ echo $KOPS_STATE_STORE
s3://example.com-state
```

You can explicitly set those variables if you are not working with the sample
Terraform configuration from this post.

The *$ZONES* variable should set to the same availability zones that we are using
in [**variables.tf**](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/blob/master/variables.tf).

{{% note %}}

**Tip**: If you want to avoid copying and pasting and you have the
awesome [jq](https://stedolan.github.io/jq/) command installed, you can set
*ZONES* by running:

```bash
export ZONES=$(terraform output -json availability_zones | jq -r '.value|join(",")')
```

{{% /note %}}

Now we can run Kops. Here is the command we will use to create our cluster:

```bash
kops create cluster \
    --master-zones $ZONES \
    --zones $ZONES \
    --topology private \
    --dns-zone $(terraform output public_zone_id) \
    --networking calico \
    --vpc $(terraform output vpc_id) \
    --target=terraform \
    --out=. \
    ${NAME}
```

Let's break this down.

* *master-zones*: tell Kops that we want one Kubernetes master in each zone in
  *$ZONES*. If you are using the default configuration in this post, that will
  be 3 masters &mdash; one each in *us-east-1a*, *us-east-1c*, and *us-east-1d*.
* *zones*: tells Kops that our Kubernetes nodes will live in those same
  availability zones.
* *topology*: tells Kops that we want to use a private network topology. Our
  Kubernetes instances will live in private subnets in each zone.
* *dns-zone*: specifies the zone ID for the domain name we registered in
  Route53. In this example, this is populated from our Terraform output but you
  can specify the zone ID manually if necessary.
* *networking*: we are using [Calico](https://www.projectcalico.org/) for our
  cluster networking in this example. Since we are using a private topology,
  we
  [cannot use](https://github.com/kubernetes/kops/blob/master/docs/topology.md#defining-a-topology-on-create) the
  default
  [kubenet](https://github.com/kubernetes/kops/blob/master/docs/networking.md)
  mode.
* *vpc*: tells Kops which VPC to use. This is populated by a Terraform output in
  this example.
* *target*: tells Kops that we want to generate a Terraform configuration
  (rather than its default mode of managing AWS resources directly).
* *out*: specifies the output directory to write the Terraform configuration to.
  In this case, we just want to use the current directory.

When you run this command, Kops does several things including:

1. Populating the *KOPS_STATE_STORE* S3 bucket with the Kubernetes cluster
   configuration.
2. Creating several record sets in the Route53 hosted zone for your domain (for
   Kubernetes APIs and [etcd](https://coreos.com/etcd/docs/latest/)).
3. Creating IAM policy
   files,
   [user data scripts](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-shell-scripts),
   and an SSH key in the **./data** directory.
4. Generating a Terraform configuration for all of the Kubernetes resources.
   This will be saved in a file called **kubernetes.tf**.

The **kubernetes.tf** includes all of the resources required to deploy the
cluster. However, we are not ready to apply this yet as it will want to create
new subnets, routes, and NAT gateways. We want to deploy Kubernetes in our
existing subnets. Before we run `terraform apply`, we need to edit the cluster
configuration so that Kops knows about our existing network resources. The `kops
edit cluster` command will open your *$EDITOR* with your cluster settings in
YAML format. We need to replace the `subnets` section with our existing vpc and
subnet information.

```bash
kops edit cluster ${NAME}
```

Your *subnets* map should look something like this:

<noscript>

```yaml
subnets:
- cidr: 10.20.32.0/19
  name: us-east-1a
  type: Private
  zone: us-east-1a
- cidr: 10.20.64.0/19
  name: us-east-1c
  type: Private
  zone: us-east-1c
- cidr: 10.20.96.0/19
  name: us-east-1d
  type: Private
  zone: us-east-1d
- cidr: 10.20.0.0/22
  name: utility-us-east-1a
  type: Utility
  zone: us-east-1a
- cidr: 10.20.4.0/22
  name: utility-us-east-1c
  type: Utility
  zone: us-east-1c
- cidr: 10.20.8.0/22
  name: utility-us-east-1d
  type: Utility
  zone: us-east-1d
```

</noscript>

{{< gist ryane 2e27124cc68340a550e39d8cd93ea0d5 "subnets-pre.yml" >}}

There should be one *Private* type subnet and one *Utility* (public) type subnet
in each availability zone. We need to modify this section by replacing each
*cidr* with the corresponding existing subnet ID for that region. For the
*Private* subnets, we also need to specify our NAT gateway ID in an *egress*
key. Modify your subnets section to look like this:

<noscript>

```yaml
subnets:
- egress: nat-0b2f7f77b15041515
  id: subnet-8db395d6
  name: us-east-1a
  type: Private
  zone: us-east-1a
- egress: nat-059d239e3f86f6da9
  id: subnet-fd6b41d0
  name: us-east-1c
  type: Private
  zone: us-east-1c
- egress: nat-0231eef9a93386f4a
  id: subnet-5fc6dd16
  name: us-east-1d
  type: Private
  zone: us-east-1d
- id: subnet-0ab39551
  name: utility-us-east-1a
  type: Utility
  zone: us-east-1a
- id: subnet-656b4148
  name: utility-us-east-1c
  type: Utility
  zone: us-east-1c
- id: subnet-cdc7dc84
  name: utility-us-east-1d
  type: Utility
  zone: us-east-1d
```

</noscript>

{{< gist ryane 2e27124cc68340a550e39d8cd93ea0d5 "subnets-post.yml" >}}

Of course the IDs will be different for you if you are following along. You can
use `terraform output` (or the AWS console/api) to find the correct IDs.

{{% note %}}

**Tip**: in
the [repository](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform) for
this post, I have a quick and
dirty
[go application](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/blob/master/gensubnets/main.go) that
will parse the Terraform output and generate a correct *subnets* section. You
can run it like this:

```bash
terraform output -json | docker run --rm -i ryane/gensubnets:0.1
```

With this, you can just paste the output from this command into the cluster
configuration that you get when you run `kops edit cluster ${NAME}`. This
application only works with the specific Terraform outputs in this example but
it could be easily modified to work with other Terraform configurations.

{{% /note %}}

After you edit and save your cluster configuration with the updated *subnets*
section, Kops updates the cluster configuration stored in the S3 state store.
However, it will have not yet updated the **kubernetes.tf** file. To do that, we
need to run `kops update cluster`:

```bash
kops update cluster \
  --out=. \
  --target=terraform \
  ${NAME}
```

If you look at the updated **kubernetes.tf**, you will see that it references
our existing VPC infrastructure instead of creating new resources. Perfect!

{{% note %}}

You may have noticed that we have an [**override.tf**](https://github.com/ryane/kubernetes-aws-vpc-kops-terraform/blob/master/override.tf) file in the repository
which declares the Terraform AWS provider settings. We are using a
Terraform [override](https://www.terraform.io/docs/configuration/override.html)
here because we need the provider to exist when we create our VPC infrastructure
but Kops also always includes the `provider` in its output. If we were not using
an override, Terraform would complain that the `provider` was declared twice
when we try to plan/apply with the generated **kubernetes.tf**. With the
override, we don't have to worry about editing the Kops-generated Terraform. It
may be possible
to
[configure Kops to skip the `provider` declaration](https://github.com/kubernetes/kops/issues/386) in
the future. That issue also describes the override workaround.

{{% /note %}}

Now we can actually build our Kubernetes cluster. Run `terraform plan`
to make sure everything looks sane to you and then run `terraform apply`.

After the `apply` finishes, it will take another few minutes for the Kubernetes
cluster to initialize and become healthy. But, eventually, you should have a
working, highly-available Kubernetes cluster!

```bash
$ kubectl get nodes
NAME                            STATUS         AGE
ip-10-20-101-252.ec2.internal   Ready,master   7m
ip-10-20-103-232.ec2.internal   Ready,master   7m
ip-10-20-103-75.ec2.internal    Ready          5m
ip-10-20-104-127.ec2.internal   Ready,master   6m
ip-10-20-104-6.ec2.internal     Ready          5m
```

{{% note %}}

A note on DNS: you may have noticed that we are using
a
[public hosted zone](http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/AboutHZWorkingWith.html) in
this example. While Kops does support using
a
[private zone](http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-private.html) (using
the `--dns private` flag with `kops cluster create`), it is currently not
compatible with the Terraform output. There are
a [couple](https://github.com/kubernetes/kops/issues/1885)
of [issues](https://github.com/kubernetes/kops/issues/1848) open about this.

{{% /note %}}

## Cleaning Up

If you want to delete all of the infrastructure we created in this post, you
just have to run `terraform destroy`. If you used a different S3 bucket for your
*$KOPS_STATE_STORE*, you may also want to run `kops delete cluster` to remove
the Kops state. Otherwise, the entire S3 bucket will be destroyed along with the
rest of the infrastructure.

---

There is a lot more to Kops than we covered here. I encourage you to check out
the [documentation](https://github.com/kubernetes/kops/tree/master/docs).

{{% optinform %}}
