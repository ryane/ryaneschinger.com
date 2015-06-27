---
title: "Continuous Delivery"
menu:
  header:
    parent: 'Services'
---

## Are you dreading your next application deployment?

Does any of this sound familiar?

* Scheduling a deployment is a bureaucratic nightmare that requires sign off by multiple departments and committees.
* Your developers have fixed a critical bug that you want to get out to production as soon as possible but you have to wait for a seeming eternity while your operations and QA teams review the new release.
* Your deployments are large updates with lots of unrelated changes and fixes. And they usually break something. Then your team has to run around with their hair on fire trying to hunt down the one tiny change that broke the application.
* A deployment is an all or nothing affair. You know that when you deploy your next release, all of your customers are going to be using the new software. If something goes wrong, it will go wrong for everyone. And, you know that there is no easy way to rollback. You brace yourself for a long night.
* Because of the risk and associated downtime, deployments are scheduled for very early on Sunday mornings ruining your weekend.
* Your deployment process is a mind-numbingly tedious manual process of logging into servers and running commands, manual testing, and various workarounds to account for slightly different configurations between environments.
* Your deployment process is manual, slow and error prone but it has to be done as quickly as possible to avoid downtime. No wonder no one on the team wants to be responsible for the deployment.

Unfortunately, this is all too common. Even though many companies have adopted agile software development methodologies, the difficulties of delivering software to production are often unaddressed.

## What is Continuous Delivery, exactly?

It is important to distinguish the difference between "Continuous Delivery" and "Continuous Deployment". These terms are often confused or used interchangeably. Continuous Deployment refers to the practice of deploying software to production as soon as automated tests pass. It is often seen as the holy grail of software delivery practices and is touted by innovative companies like Etsy and Netflix. Continuous Delivery is a pre-requisite step along the spectrum to Continuous Deployment. The extremely important distinction is that Continuous Delivery only refers to the idea that an application is ready to be deployed at any time. It ensures that a new software release can be deployed automatically to a staging environment and verifies everything is working correctly through a suite of automated tests. The same automated deployment can be used to deploy to production but that remains a controlled, manually triggered process.

I've seen a lot of companies dismiss the idea of adopting Continuous Delivery practices by saying things like "We have no need to deploy 10 times a day". Of course, as you know, they are confusing Continuous Deployment with Continuous Delivery. But, they are often right - continuous deployment doesn't make sense for every organization. However, they are throwing the baby out with the bathwater. While Continuous Deployment may not be right for every organization, Continuous Delivery is a fundamental requirement for any organization who ships software to customers.

With a solid Continuous Delivery practice in place, you should always be confident that your newest release will work correctly on production. Instead of a tense and tedious process, the only thing you should have to do to release a new version to production is to press a **"Deploy"** button.

* Without a an automated deployment, human errors **will** occur on every single deployment.
* Manual deployment processes require extensive documentation. It is very easy for the documentation to become out of date and a lot of valuable time is spent by development or operations staff during each deployment. Their time is better spent on other things.
* If a deployment is not automated, it is not reliable or repeatable.
* When a deployment is automated, it can be triggered by anyone on the team. Too often, with manual deployments, only one person is familiar enough with the process and is always stuck performing it. Having to rely on a single person is a risky proposition. What if they are taking a sick day when a mission-critical fix needs to be released?
* If it is not automated, each deployment for a new release is essentially happening for the first time and that is not a situation you want to be in when it comes to delivering new software to your customers.
* If your staging or testing environment is different than your production environment, you **will** experience problems with your releases.

## How I can help

My goal is to make your software deployments routine and boring. You should not have to schedule your deployments for late at night, early in the mornings or on weekends. Your deployments will no longer require a long process document and checklist. You will not have to rely on a single deployment "expert" to release a new version of your application - anyone on the team will be able to press the deploy button. New releases will no longer be risky and a source of stress. You will be able to increase your response time and deliver fixes or features to your customers much more quickly. Deployments can be smaller and more frequent enabling you to experiment more and adapt rapidly to customer feedback. Reducing the time it takes between identifying an improvement to your software and delivering it to your customers is going to enable your organization to improve the quality of your software.

I will work with you and your team to ensure that you have a solid Continuous Integration solution in place. Continuous Integration refers to the ability to automate the build and test phase of your application before you deploy it - whether to a testing, staging, or production environment. It is the foundation of a successful Continuous Delivery process. It is important to verify that your application meets certain quality criteria before you deliver it. Next, I will help ensure that your deployment is completely automated. After a new release passes the Continuous Integration phase, we will make sure it is automatically deployed to a production-like staging environment. At that point, manual or automated acceptance tests can be run to make sure the release is ready for production. We will enable your team to simply run a single script or press a button to kick off the deployment to production whenever you are ready. Based on the needs of your organization, we will evaluate whether or not it makes sense to move further along the spectrum towards a Continuous Deployment practice.

---

Continuous Delivery is going to enable your business to react to the needs of your customers much more rapidly - whether that is fixing problems or delivering new features. It can help lower stress and improve the morale of your team. It is immensely satisfying when a developer is able to get out new code that they may be really proud of to customers right away. And, of course, your customers are going to be delighted when you are able to meet and exceed their expectations on a regular basis.  <a href="mailto:ryan@ryaneschinger.com">Contact me </a> to learn more about how I can help your company achieve the benefits of Continuous Delivery.
