---
title: How to Prepare for a Successful Launch
tags:
- best practices
date: 2014-01-22
url: /blog/how-to-prepare-for-a-successful-launch/
menu:
  header:
    parent: 'articles'
---

Launching a new web application can be a nerve-wracking experience. Besides being nervous about how your users are going to respond to your product, you also have to worry about whether the site will stay up and running in the first place. It is important to be well prepared for any issues you may encounter when you unleash your web application to the public for the first time. It can be hard to predict how much (or how little) traffic you are going to get. You don't want to get paralyzed by fear and doubt and delay your launch while you (prematurely?) optimize everything you can but you also don't want to end up with a failing application and no plan to get it back up and running quickly. There are certainly some things you can do to prepare for your launch and to handle an unexpected load of traffic.

### Availability Monitoring

The simplest thing you need to be aware of is whether your site is responding. You obviously want to know as soon as possible if your site is not available to your customers. You are probably going to be watching your site closely during the first hours of your launch but you are not going to be able to babysit it 24 hours a day. Therefore, it is important to have an automated system testing your site's availability and alerting you when something goes wrong. Availability monitoring can be as simple as making sure your site is accessible or you can actually configure some services to test an important interaction on your site to make sure it is functioning correctly. There are lots of services that provide availability monitoring. I like [Pingdom](https://www.pingdom.com/).

### Have a scaling plan

Deploying your application to a cloud computing platform can have some advantages here. For example, [Heroku](https://www.heroku.com/) will let you spin up additional worker processes to handle additional load by moving a slider on a web page:


{{% figure src="/images/heroku-scale-slider.png" alt="Heroku Scale Slider" %}}

This lets you increase capacity on-demand. Other platforms, like [Windows Azure](http://www.windowsazure.com/en-us/) and [Amazon EC2](http://aws.amazon.com/ec2/) also have similar capabilities, including the ability to auto scale based on conditions you define (when CPU utilization exceeds 75%, for example). The degree of hand-holding can vary by each platform so you should be familiar with how to take advantage of their capabilities and you definitely should test your setup in advance of your launch. If you are running on your own infrastructure, you may have to do a lot more work to roll your own scaling solution but having a plan to deal with this is a good idea.

Quick-scaling can be a great way to handle an unexpectedly high load of web traffic but it is not a silver bullet. There can be performance or application problems that additional capacity will not be able to solve. For example, an application bug or a poor performing database query will still create problems for your users regardless of the number of people you can serve at once. Therefore, you want to have a plan to get fixes out there quickly when necessary.

### Be able to deploy quickly

Bugs are going to happen. Changes are going to be necessary. You will need to redesign features to accommodate what users actually want. When it comes to software, there is no escaping these fundamental truths. Having an established and repeatable release process is the most important factor in determining how quickly you can get these changes or fixes out to your users. The goal here is to be able to deploy a new version of your application by pressing a single button or running a single command and with minimal downtime to your users. I like to have a [continuous integration](http://www.thoughtworks.com/continuous-integration) process setup for my clients to ensure that the changes I make build, pass an automated test suite, and are ready to release. Whether you move towards a continuous delivery process or not, you still should make sure you can remain agile and get your fixes out rapidly and efficiently.

Having the ability to release new versions of your application quickly and reliably is all well and good but how do you know what fixes you need to make? How do you know what problems your users are having?

### Exception tracking

It is not unusual to experience application errors and strange edge cases that you never ran into when your application was in development or even when running in a staging environment. You don't want to rely on your users to provide bug reports. It is important to know what exceptions are happening in real time and for that you can use an exception tracking service. There are a variety of options available such as [Sentry](https://getsentry.com), [Honeybadger](https://www.honeybadger.io/), [Airbrake](https://airbrake.io/) and others. These services alert you when unhandled exceptions occur and usually provide useful debugging information like line numbers and stack traces. They also can aggregate the exceptions so that you can see the ones that are happening most often and prioritize fixes for those issues.

### Feedback

User feedback is important throughout your launch. The problem is that only a small portion of enthusiastic users will provide unsolicited feedback. And, even if they do, an even smaller percentage of that feedback will actually be thoughtful, useful or detailed enough to take action on. One thing you can do is proactively and directly reach out to your users and ask them for feedback. An authentic and personalized request for feedback sent directly to a user will likely result in better information. And be careful about asking for feedback from friends. The data you get from people who don't know you personally will tend to be less biased.

Besides directly reaching out to users, your application should provide easy ways leave feedback for the portion of users who want to do so. At minimum, you should have a contact form that allows a visitor to email you comments or questions. You can also leverage tools like user testing, surveys, forums or live chat to get insights from your users. There are lots of services out there that you can leverage to provide these avenues of communication.

Finally, you can get really valuable feedback from your users, not from communicating with them directly, but from watching their behavior on your site. There are a variety of analytics services that can provide valuable insight. Of course, there is [Google Analytics](http://www.google.com/analytics/) which can simply show the number of visitors and page views you are getting. Or, you can get more sophisticated and setup goals and conversion tracking. [KissMetrics](https://www.kissmetrics.com/) provides better tools to track "people" and where they are coming from. And [CrazyEgg](http://www.crazyegg.com/) can show you how people are actually **using** your site. These are not the only options by any means - there are lots of other services worth checking out, too.

### Performance monitoring

"The activity feed page is SLOW". "Why does it take so long to get my search results?". Sometimes you will find that features you are proud of and that were blazingly fast when you were testing them, fall down in production or under load. But it is not always easy to figure out what exactly is responsible for the sluggishness. This is where tools like [New Relic](http://newrelic.com/), [Scout](https://scoutapp.com/) and others can help. They can give you a breakdown of each web request and show you visually how long each part is taking. Is it database access or external network requests that are taking so long? These tools can show you. They are not only be useful for troubleshooting a specific performance problem but they can give you insight into potential performance issues in your application with sometimes surprising results. Years ago, I still remember the shock I felt when I realized that the biggest performance problem on a problematic page of my application was not the complicated SQL query but simply the rendering of the view.

### Be available

All of these things require you to be available during your launch. Set aside some time for your team to be monitoring your launch and be available to respond to any issues that may occur. Preparation, having a plan, and being present for the launch are the most important things you can do.

While you can do your best to have a scalable, bug-free launch, it is hard to anticipate every potential issue. Having a plan in place and some tools available is the best way to resolve these issues quickly and with as little negative impact to your new users as possible. Good luck on your launch!
