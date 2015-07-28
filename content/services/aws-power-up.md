---
title: "AWS Power-Up"
menu:
  header:
    parent: 'Services'
---

## Migrate your Rails application from Heroku to AWS

Are you frustrated by the lack of control and high costs of Heroku? Have you been considering migrating your Rails application to Amazon Web Services (AWS)? Despite its reputation, you do not need a team of cloud architects and systems administrators to build your application on top of AWS. I can help make a migration easy, painless and with minimal changes to your application and deployment workflows.

## AWS-powered infrastructure with the ease of use of Heroku

When you started building your application - you made the right choice. You decided to focus on your business by spending time on the most valuable pieces of your application. Solving your customers' problems was the most important thing. And, so you wanted to get the application online and in the hands of your users as quickly as possible. To do that, you deployed your application to Heroku.

Heroku is an extremely simple and convenient way to deploy applications. They have done a great service to make it dead easy for anyone - regardless of skill level - to get their application online without headaches. And they've done this by fully abstracting away the underlying server platforms and infrastructure. When deploying to Heroku, you simply do not need to understand what is going on under the hood. 

But, at some point, as your application grows, you will start to experience pain and frustration with Heroku. Maybe there are platform limitations that are preventing you from building features your application really needs. Or maybe you are experiencing friction with your development and deployment workflows. You might be frustrated by inexplicably slow performance or API outages that are preventing you from deploying your application. Or, as is frequently the case, you may just be shell-shocked by the enormous hosting costs needed to support your application on Heroku.

You might have known that using Heroku was going to be costly going in. But you were willing to pay for that convenience - and rightly so. It allowed you to rapidly build and deliver your application. But, now that you've reached a certain scale, it might be time to re-evaluate whether or not you are spending money wisely. At some point, you have to consider whether you are throwing money away. You could be paying a lot less for more power, speed, and flexibility. 

You might have looked at other hosting options or cloud providers. You may have written them off as too complicated. After all, you might not have a dedicated operations team to build and maintain infrastructure on a platform like AWS. But, AWS does not have to be complicated. You do not have to have a dedicated operations team to manage things for you. Your developers, with their existing skill sets, can deploy your application to more powerful, more available, auto-scaling AWS infrastructure as easily as they can to Heroku. All for a much lower monthly cost. Did you know that Heroku itself is built on top of AWS? Why not skip the middleman?

## How I can help

I understand the needs of your business and your application. I understand that moving your infrastructure is a decision that is not to be taken lightly and that there must be a bigger ROI than just saving a few dollars on hosting each month. You have big goals and you want to make sure that your application is ready to meet and exceed the expectations of your customers. Migrating your application to AWS is more than a cost-savings move: it can lay the foundation for the long-term future growth for your business.

However, it *is* important that the hidden costs of using another platform do not eat away all of the savings you get by switching. If you were forced to hire a full-time systems administrator for your new platform, then a change may not be justified. With just a little guidance and part-time assistance, though, your application can leverage the full power of AWS without compromising quality or taking your team's time away from improving your business. 

## Who is this for?

* **Do you feel like you are throwing money away on Heroku but just don't have the time or resources to make a change?** I can help you evaluate your application to determine what it would take to migrate to AWS. How much would it cost? How much will you save? What performance and scalability benefits will you achieve? These are all questions I can help answer.

* **Are you frustrated by slow performance?** Heroku does a great job of abstracting away the underlying infrastructure. This is great when you are starting out. As your application grows, however, you are going to need more visibility and granular control of your resources - not to mention more control of your costs.

* **Do you want to go to the next level and make your infrastructure a competitive advantage?** You've seen other organizations talk about the benefits they have seen by adopting continuous integration and delivery, configuration management, "infrastructure as code", and other Devops practices that help you deliver better software, faster. Use git to control your infrastructure just like you do your code, spin up new environments at the push of a button, run integration tests across temporary test infrastructure - all of these things can be achieved more easily on AWS. Even if you think that you don't need these capabilities right now, why not establish the foundation so that you can more easily grow into them later?

## What you get?

This is a 2-phase engagement that consists of an evaluation and implementation. 

### The Evaluation

The first step is to determine your business goals and the problems you want to solve with your application. Next, I will evaluate the technical details of your application. I'll take a look at things like your data stores, dependencies, 3rd-party services and existing load and usage patterns. Finally, I'll also want to get an understanding of your current development workflows and the skill set of your staff.

With that information, I will deliver a plan for migrating your application to AWS. This will include a breakdown of which AWS services would be appropriate for your application, an estimated cost breakdown, and an estimate of how long it will take to deliver the solution. I will also identify any potential application-level code changes you might need.

At the end of the evaluation, you will end up with a comprehensive action plan for building a more available, resilient and scalable infrastructure for your application, powered by AWS.

### The Implementation

If, after reviewing the evaluation, you want to move forward with your AWS migration, I will begin the implementation phase. The scope and details of the AWS services we will leverage will have been determined in the evaluation. But, at minimum, your application stack will consist of the following features:

* **A load-balanced, multi-data center infrastructure.** With Heroku, you have little control over how your application is balanced across availability zones. The best you can do is control whether your application lives in the United States or Europe. With AWS, we can ensure that your application is load-balanced across at least two separate data centers. If a server happens to go down, the load-balancer will automatically start routing traffic to only healthy servers.

* **Auto-scaling.** This is an amazing capability. While Heroku lets you easily increase capacity on-demand, we can build an infrastructure that automatically scales up (and down) based on usage patterns we define. For example, we could configure our infrastructure to automatically launch one or more new application servers when the CPU usage on our existing servers is too high. And, then terminate those servers when the usage returns to more manageable levels. In the evaluation phase we will determine the metrics to use for your auto-scaling policies and you will know how to adjust them as you learn more about the resource usage of your application.

* **Managed database.** Most applications are going to be reliant on a database. We will leverage Amazon RDS to provide a high-performance, managed database for your application. Many applications rely on PostgreSQL and one of the reasons to use Heroku was its great managed PostgreSQL service. Now that Amazon offers a compelling managed PostgreSQL database service there is one less reason to stay with Heroku. And, if your app uses MySQL, that is available too.

* **Billing alerts.** Due to the dynamic, automated nature of AWS, you will want to keep a close eye on your resource usage. I will establish notifications to alert you when costs are approaching or exceeding certain levels. You won't be surprised by an enormous bill that you were not prepared for at the end of the month.

* **Automated backups.** I will establish an automated backup schedule and retention policy for your database. Hopefully, you will never need it but instructions on how to restore your database from backups will be provided. Optionally, as part of a maintenance contract, I can periodically test your restore procedures so that you can always be confident you can recover in a disaster and know how long it will typically take.

* **Easy deployments.** One of the nicest things about Heroku is its `git push` deployment workflow. Deployments can be just as simple on AWS and I'll deliver a solution that will allow you to deploy your application with a single command. And, if you have more sophisticated deployment needs, I can work with you to create a robust [continuous delivery](/services/continuous-delivery/) pipeline.

All of this infrastructure configuration will be stored in version control and you will have the ability to spin up new environments on-demand. You will also receive documentation that covers things like:

* How the infrastructure works
* How to make changes to it
* How to create new environments
* How to remove environments
* How to deploy your application

## Who am I?

I'm Ryan Eschinger and I have over 15 years of experience in operations and application development. I've helped many companies develop, test, and deploy their applications on cloud platforms like AWS.

## Take action now

If you are looking to migrate from Heroku to AWS now, you've come to the right place. I can help get you there fast without taking your developers away from working on your application. You'll have a high-performance, more scalable, cost-effective and version controlled infrastructure that will improve your application now and provide a foundation for future growth.

## Availability

**Currently, there is 1 slot available**. If you are ready to get started, please *<a href="https://jossware.wufoo.com/forms/heroku-to-aws-migrations-from-ryaneschingercom/" target="_blank">fill out this application</a>*. I'll review it and then follow up shortly to schedule a call so that we can go over the next steps. *Have any questions?* [Email me](mailto:ryan@ryaneschinger.com) and I'll get back to you soon.

<p class="pitch-sig" >
Thanks! <br/> &mdash; <a href="mailto:ryan@ryaneschinger.com">Ryan Eschinger</a>
</p>

<div class="ps">

PS: Introductory pricing is currently in effect. <a href="https://jossware.wufoo.com/forms/heroku-to-aws-migrations-from-ryaneschingercom/" target="_blank">Apply</a> now to take advantage of this service before the price goes up. If you are not ready to get started at this time, you should <a href="https://www.getdrip.com/forms/1176915/submissions/new" target="_blank"> subscribe to my newsletter</a>. I'll keep you updated on this service as well as providing useful advice about AWS, continuous delivery and other Devops topics.

</div>
