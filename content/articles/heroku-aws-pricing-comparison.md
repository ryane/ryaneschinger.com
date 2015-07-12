---
draft: true
title: Heroku AWS Pricing Comparison
tags:
- aws
- heroku
date: 2015-07-13
url: /blog/waiting-on-ec2-resources
menu:
  header:
    parent: 'articles'
---

*How much money am I going to save?*

This is the most common question people seem to ask when considering moving from Heroku to AWS. And, like almost all difficult questions, the answer is "It depends". It is difficult to compare pricing directly as the services Heroku provides are not completely analogous to AWS and vice versa. We are not comparing apples-to-apples here. Also, there are definitely some hidden (or at least difficult to quantify) costs that you will incur when switching. For example, it is possible your team will have to spend more time on operational tasks when hosted on AWS. At the same time, if you stay on Heroku, your team may end up troubleshooting performance problems with limited access to the underlying system or trying to workaround platform limitations imposed by the platform. There is also a large potential opportunity cost in terms of the reduced flexibility and diminished ability to iterate rapidly when your application is constrained by its platform.

In this installment, I am going to try and quantify the more tangible cost differences between Heroku and AWS. We'll look at pricing out a simple web application at various performance levels. Hopefully, this will give you a rough idea of the potential cost savings.

### Heroku Pricing

Heroku recently rolled out a new pricing model which I am using for this comparison. In general, this model is priced more competitively with AWS (a good thing). The traditional pricing model may or may not still be available as you read this but the cost differences would be even more pronounced on the traditional model.

### Terminology

Heroku is considered a Platform as a Service (PaaS) offering and, as such, has abstracted compute resources into something it calls *dynos*. Dynos are basically Linux containers that run a specific command. There are two main types of dynos on the Heroku platform: web and workers. Web dynos serve http requests (you would typically run an application server in a web dyno) and worker dynos are used for running background processes ([Sidekiq]() workers, for example). Dynos are available at different performance levels. Each dyno type has an allocated amount of memory and a CPU share. Again, due to the abstracted nature of the Heroku platform, it is not clear exactly what a single CPU share equates to. Dynos start at 512mb of memory with a single CPU share up to dynos with 6gb and 100% CPU allocation.

On AWS, we are going to be primarily looking at [EC2 (Elastic Compute Cloud)]() and [RDS (Relational Database Service)](). EC2 basically lets you dynamically create virtual machines that run in Amazon's data centers and RDS is a managed database service (think Postgresql and Mysql in the cloud). EC2 instances are available in a huge range of different memory, cpu and disk configurations. Because it is not really feasible to directly map a Heroku dyno to a specific EC2 instance size, I am just going to do my best to compare similar configurations.

### Free options

Note that both AWS and Heroku offer the ability to run an application on their platforms free of charge. There are various limitations to these free tiers and they are generally not suitable for production applications so I am not going to compare them here. Please see the following for more details: 

* https://www.heroku.com/pricing
* http://aws.amazon.com/free/

### Heroku Hobby

Heroku's new pricing model includes a Hobby plan that costs a flat $7 / dyno per month. However, you are limited to a single web and a single worker dyno per application (both 512mb). So you are looking at about $14 per month for a web application with a single web and worker dyno. While this is great for a hobby project (hence the name), this is not really a great option for a production application. Just as a quick point of reference, you could run 2 AWS EC2 [t2.micro]() instances for less than $20 per month which would actually provide more compute resources.

### Sample Application

Our theoretical sample application is going to consist of a web application and background worker process that talks to a Postgresql database. We will start with a small, low traffic application configuration. 

2 1x (512mb) Web Dynos at $25.00 each per month: $50
2 1x (512mb) Worker Dynos at $25.00 each per month: $50
Heroku Postgres Jade (capped at 10K rows, not ideal for production): $0
Total: $100 month

Let's start with t2.micro instances which provide 1gb of memory and a single
vCPU. Arguably, these instance sizes will provide better performance than a
single 1x Heroku dyno (again, straight comparisons are really difficult to
make due to the underlying platform difference). To keep things simple, we'll run a single EC2 instance for each dyno. In practice, especially as you scale up to larger instance sizes, you maybe able consolidate on fewer instances.

4 t2.micro (1 GB RAM) instances: $38.08
1 db.m1.small RDS instance (1.7 GB RAM, 20 GB storage): $46.22
Total: $84.30

So, you are saving a little over $15 / month on AWS but you are getting
significantly more compute and storage resources (especially at the database level). For fun, let's move up to t2.small instance type which doubles the amount of RAM on each instance (quadruples the RAM allocated to a single dyno on Heroku).

4 t2.small (2 GB RAM) instances: $76.16
1 db.m1.small RDS instance (1.7 GB RAM, 20 GB storage): $46.22
Total: $122.38

Again, you probably don't need all 4 EC2 instances to equal the throughput of the 4 Heroku dynos but this just illustrates that for $22 and change per month more, you will get more power. 

As we'll see, the savings will increase as we scale our application.

2 2x (1 GB) Web Dynos at $50.00 each per month: $100
2 2x (1 GB) Worker Dynos at $50.00 each per month: $100
Heroku Postgres Standard 0 (1 GB RAM, 64 GB storage, 120 connections): $50
Total: $250 month

Let's stick with the larger t2.small (2 GB) instances for this comparison. 

4 t2.small (2 GB) instances: $76.16
2 db.m1.small RDS instance (1.7 GB RAM, 64 GB storage): $46.22
Total: $178.72

We bumped up the number of database instances to achieve some fault tolerance. As you can see, on AWS we get more computing resources for a significantly lower monthly price. 

Let's check out a larger application.

8 Intermediate (2 GB) web dynos at $250.00 each per month: $2000
4 2x (1GB) worker dynos at $50.00 each per month: $200
Heroku Postgres Premium 4 (15 GB RAM, 512 GB storage, 500 connections): $1200
Total: $3400 month

8 t2.large (8 GB) instances: $609.04
2 db.m3.xlarge (15 GB, 512 GB storage): $688.72
Total: $1297.76

Wow. That is over a 60% reduction in monthly costs and a $25000 of savings over the course of the year.

### AWS Reserved Instances

All of the above examples were made using the AWS on-demand pricing model. You can also achieve additional savings if you commit to paying for your instances for a specific period of time and even more for paying up front. Using our last example, if you committed to paying for the 8 t2.large instances for 1 year, you would pay $420.48 / month (compared to 609.04). If you paid for 1 year up front, your actual cost per month would go down to approximate $402. And, if you paid for 3 years up front, your calculated cost per month would go down to ~$270 / month.

### Additional AWS Costs

I have to admit that I cheated a little bit when making these comparisons. There are going to be some additional costs when running on the AWS platform. Almost all resources you use on AWS have a per-usage cost associated with them. Because these can vary greatly based on usage, I chose to leave them out for the sake of simplicity. But most of these additional costs are going to be negligible compared to the pure compute costs I used in the examples above. Here are some examples of some other costs you might incur on AWS:

IP address (Elastic IP): $3.66 / month
ELB (Elastic Load Balancer): $18.30 / month
Data Transfer (120 GB out, 80 GB in): $42 / month

There is no question that Heroku's pricing model is simpler than the AWS model. But, you will also pay a lot more for an application at any kind of scale. 

### Takeaways

When comparing only the cost of the compute resources between Heroku and AWS, there is no doubt that you can achieve significant savings on AWS. However, as mentioned above, that is not the whole story. You also have to consider the additional operational costs you may incur on AWS. These can be significant if you don't have the experience to manage such a platform. It is possible to build an application architecture on AWS that minimizes ongoing operational costs and provides an experience that is as easy to use for your developers as Heroku.
