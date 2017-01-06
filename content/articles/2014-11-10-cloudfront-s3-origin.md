---
title: CloudFront with an S3 Origin
tags:
- rails
- aws
- cloudfront
date: 2014-11-10
url: /blog/cloudfront-s3-origin/
menu:
  header:
    parent: 'articles'
---

In a [previous post](/blog/using-cloudfront-to-speed-up-your-rails-application/), I covered how to setup [CloudFront](http://aws.amazon.com/cloudfront/) as an asset host for a Rails application using the same site as the origin. It is also possible to use an S3 bucket as the origin. The easiest way I know of to make this work with Rails is to use the [asset_sync](https://github.com/rumblelabs/asset_sync) gem.

<!--more-->

## Creating the CloudFront Distribution

First you need to setup a bucket in S3. Then, when you create your CloudFront distribution, choose your bucket from the dropdown list when you set the Origin Domain Name. Otherwise, the steps are the same as in [post](/blog/using-cloudfront-to-speed-up-your-rails-application/).

{{% figure src="/images/cloudfront-s3-distribution.png" alt="CloudFront S3 Origin" %}}

## Configuring asset_sync

You don't need to follow all of the steps in the [Readme](https://github.com/rumblelabs/asset_sync/blob/master/README.md). You should add the gem to the Gemfile and `bundle install` it. You will also need to configure asset_sync with your AWS Access Key ID and your Secret key. And, you should set the *FOG_DIRECTORY* to the name of your S3 bucket. But, **do not** set the `config.action_controller.asset_host` as described in the Readme. You still want to use the CloudFront domain name for your asset host as shown in the previous [post]({{< relref "articles/2014-11-06-using-cloudfront-to-speed-up-your-rails-application.md" >}}).

There are a lot of other options but that is really all you need to get going. When you run the `assets:precompile` rake task (usually as part of your deployment), your assets will automatically sync to your S3 bucket. And, CloudFront will pull updated assets from that same bucket.

## Why use S3 as a CloudFront origin?

I am not convinced that using S3 as your CloudFront origin is always a huge advantage. For one thing, it can slow down your deployments. However, there are some reasons to consider doing so. With this setup, CloudFront should never have to hit your server to check for updated assets. And, in some cases, it can make handling things like [serving font assets](/blog/web-fonts-cloudfront/) simpler when you are hosted on a service like Heroku. Let me know if you know of any other reasons why it is preferable to use S3 as a CloudFront origin.

{{% optinform %}}
