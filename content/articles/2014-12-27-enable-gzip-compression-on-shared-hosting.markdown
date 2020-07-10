---
title: Enable Gzip Compression on Apache Shared Hosting
tags:
- performance
date: 2014-12-27
url: /blog/enable-gzip-compression-on-shared-hosting/
menu:
  header:
    parent: 'articles'
---

I was working on tuning the performance of a site that happened to be hosted on a shared hosting provider - [Dreamhost](http://www.dreamhost.com/) in this case. One of the simplest things you can do to improve performance is enable Gzip compression for HTTP requests. This is supported in all modern browsers and provides a quick win by reducing the size of HTTP responses and, therefore, improving response times. The instructions on how to enable this will vary based on your web server and the level of control you have.

<!--more-->

{{% figure src="/images/yslow-compress-a.png" alt="YSlow Compression Grade A" %}}

Dreamhost's shared hosting platform is based on [Apache 2](http://httpd.apache.org/). Since they don't provide the necessary privileges to update the server configuration files directly, you can use configuration directives in an [*.htaccess*](http://httpd.apache.org/docs/2.2/howto/htaccess.html) file to enable compression. In Apache, compression is provided by the [mod_deflate](http://httpd.apache.org/docs/current/mod/mod_deflate.html) module and a typical configuration could look something like:

{{< highlight apache >}}
#Gzip
<ifmodule mod_deflate.c>
AddOutputFilterByType DEFLATE text/text text/html text/plain text/xml text/css application/x-javascript application/javascript text/javascript
</ifmodule>
#End Gzip
{{< /highlight >}}

Of course, you can change the list of content types to best fit your site. Typically, you would add this to the *.htaccess* file in your web root directory (or create one if it does not already exist).

Now run [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) or [YSlow](http://yslow.org/) and see your improved performance scores!

{{< optinform >}}
