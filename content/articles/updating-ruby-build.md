---
title: Updating ruby-build to get the latest rubies
tags:
- ruby
date: 2014-10-05
url: /blog/updating-ruby-build/
menu:
  header:
    parent: 'articles'
---

No rocket science here - just because I always forget... If you are using [rbenv](https://github.com/sstephenson/rbenv) with the [ruby-build](https://github.com/sstephenson/ruby-build) plugin and want to upgrade to the latest version of ruby, you might have to update ruby-build to get the latest definitions.

<!--more-->

{{< highlight bash >}}
$ rbenv install 2.1.3
ruby-build: definition not found: 2.1.3
{{< /highlight >}}

ruby-build does not know about 2.1.3 yet.

{{< highlight bash >}}
$ cd ~/.rbenv/plugins/ruby-build
$ git pull
{{< /highlight >}}

Try again:

{{< highlight bash >}}
$ rbenv install 2.1.1
Downloading ruby-2.1.3.tar.gz...
-> http://dqw8nmjcqpjn7.cloudfront.net/0818beb7b10ce9a058cd21d85cfe1dcd233e98b7342d32e9a5d4bebe98347f01
Installing ruby-2.1.3...
Installed ruby-2.1.3 to /home/ryan/.rbenv/versions/2.1.3
{{< /highlight >}}

Of course, this assumes you installed rbenv from the git repository. If you used [Homebrew](http://brew.sh/) on OSX, you can do something like this:

{{< highlight bash >}}
$ brew update
$ brew upgrade ruby-build
    {{< /highlight >}}
