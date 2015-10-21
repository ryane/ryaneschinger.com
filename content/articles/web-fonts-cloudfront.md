---
title: Web Fonts with CloudFront
tags:
- rails
- aws
- cloudfront
date: 2014-11-09
url: /blog/web-fonts-cloudfront/
menu:
  header:
    parent: 'articles'
---

In my last [post]({{< relref "articles/using-cloudfront-to-speed-up-your-rails-application.md" >}}), I may have been a little cavalier when I said it is a "no-brainer" to use CloudFront to serve assets for your Rails application. In truth, there are a few issues that can make things more complicated. One of those is the ability to serve web fonts.

<!--more-->

Some browsers consider fonts hosted on a different domain a security issue and will reject requests for them. You might see errors like this in your console (this one is from [Firefox](https://www.mozilla.org/en-US/firefox/new/)):

```
downloadable font: download failed (font-family: "FontAwesome" style:normal weight:normal stretch:normal src index:1): bad URI or cross-site access not allowed
source: http://d8zsam6pvh6uj.cloudfront.net/assets/font-awesome/fontawesome-webfont-7b07ce57a267815b7902936332129d46.woff @ http://d8zsam6pvh6uj.cloudfront.net/assets/application-b26748aa744d2aae6de1e5a4cab16c2f.css
```

One solution to this problem is to make sure the appropriate [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) headers are included when CloudFront requests the assets from your origin for the first time. Of course, how to actually set these headers is going to vary depending on your origin.

## Nginx Origin

I often use [nginx](http://nginx.com/) in front of my rails application server. In my nginx server block (virtual host) configuration, I can add a configuration like this to ensure that the **Access-Control-Allow-Origin** is set:

{{< highlight nginx >}}
location ^~ /assets/ {
  gzip_static on;
  expires max;
  add_header Cache-Control public;

  location ~* \.(ttf|ttc|otf|eot|woff|svg|font.css)$ {
    add_header Access-Control-Allow-Origin *;
  }
}
{{< /highlight >}}

## S3 Origin

Amazon recently added the ability to configure the CORS headers that will be included in the HTTP response for assets on S3.

In the [AWS Management Console](https://console.aws.amazon.com/s3/home), navigate to the Properties tab of your S3 bucket, expand the Permissions section, and click *Add CORS Configuration*. The sample configuration might work for you but customize as needed.

{{< highlight xml >}}
<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>Authorization</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
{{< /highlight >}}

{{% note %}}
In all of the examples above I used an origin of **\***. For additional security, you may want to consider actually using the domain name of your site. Just be careful, because the allowed origin must match to ensure the browser will download the assets correctly.
{{% /note %}}

## Heroku Site Origin

I actually haven't had the opportunity to test this yet but the [font_assets](https://github.com/ericallam/font_assets) gem seems to be a common solution. The other option would be to use S3 as the origin instead. What techniques are people using to solve this problem on Heroku (or other host that may not give you access to customize CORS headers)?

{{% optinform %}}
