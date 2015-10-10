---
title: 11 Capistrano Plugins To Simplify Your Rails Deployments
tags:
- rails
- ruby
- capistrano
- devops
date: 2014-10-12
url: /blog/11-capistrano-3-plugins-to-simplify-your-rails-deployments/
menu:
  header:
    parent: 'articles'
---

The Rails deployment story has improved dramatically since the early days, but it can still be challenging. Compiling assets, running migrations, achieving zero-downtime deployments, and load balancing your application servers are some of the tasks that you'll want to handle as part of your deployment strategy. Many deployment processes still tend to be a mixture of automation and manual work. The goal is to have a fully automated, repeatable and fast deployment process. Sounds simple on paper, but as many of us already know, this process is time consuming, error prone and has the tendency to make you want to rip your hair out or throw your keyboard out the window.

<!--more-->

For those of us not using [Heroku](https://www.heroku.com/), [Capistrano](http://capistranorb.com/) is a de facto standard when it comes to deploying Rails applications. Capistrano version 3 was released a little over a year ago and is substantially different than version 2. For one, Capistrano is no longer a monolithic framework designed for just deploying Rails applications. It uses a more modular design and is intended to be framework agnostic. It should be possible to use Capistrano to deploy a NodeJS or Clojure application, for example. Much of the Rails specific tasks have been broken out into separate gems. In addition, there is a growing ecosystem of plugins that can be included to perform specific tasks. Using these plugins can save you lots of time and effort when it comes to creating your deployment solution.

# The Essentials

### capistrano-rails

[capistrano-rails](https://github.com/capistrano/rails) provides tasks that you are going to need on just about every Rails application. It includes tasks to set your environment, manage your assets, and run (or not run) your migrations.

### capistrano-bundler

[capistrano-bundler](https://github.com/capistrano/bundler). Just like it sounds - this plugin will run `bundle install` as part of the Capistrano deployment flow. You can also use the standalone task to install your gems on an ad-hoc basis. There are a number of ways to configure the bundling process such as the ability to parallelize your gem installs.

### capistrano-rbenv

[capistrano-rbenv](https://github.com/capistrano/rbenv). This is a core plugin that is going to configure Capistrano to use the correct, rbenv version of ruby when running your deployment. Take a look at [capistrano-rvm](https://github.com/capistrano/rvm) or [capistrano-chruby](https://github.com/capistrano/chruby) if you use one of those version managers instead.

# Other Useful Plugins

### capistrano-passenger

[capistrano-passenger](https://github.com/capistrano/passenger) simply provides a task to restart [Passenger](https://www.phusionpassenger.com/) after the publishing phase of the deployment. You'll want this if you serve your application with Passenger.

### capistrano-unicorn-nginx

[capistrano-unicorn-nginx](https://github.com/capistrano-plugins/capistrano-unicorn-nginx). If you use [unicorn](http://unicorn.bogomips.org/) behind [nginx](http://nginx.com/) to serve your Rails application, you might want to take a look at this. It can help you configure single node or clustered unicorn deployments. It supports zero-downtime deployments and provides some basic server management capabilities such as the ability to restart unicorn. You can also look at  [capistrano3-unicorn](https://github.com/tablexi/capistrano3-unicorn) for an alternative option.

### capistrano3-puma

[capistrano3-puma](https://github.com/seuros/capistrano-puma). This is along the same lines as capistrano-unicorn-nginx, but for the [puma](http://puma.io/) server.

### capistrano-postgresql

[capistrano-postgresql](https://github.com/capistrano-plugins/capistrano-postgresql) allows you to automate some of the typical administration tasks you will need to perform to set up Rails with Postgresql. For example, you can use it to create your database and database user. It can also generate a populated database.yml with the correct information. Since populating database.yml is a step that is often not automated at all, this is can be pretty powerful.

### capistrano-faster-assets

[capistrano-faster-assets](https://github.com/capistrano-plugins/capistrano-faster-assets). Speed up your deployments by only compiling assets when needed.

### slackistrano

[slackistrano](https://github.com/supremegolf/slackistrano). Keep your [Slack](https://slack.com/) channel notified about deployments with this simple plugin.

### capistrano-pending

[capistrano-pending](https://github.com/a2ikm/capistrano-pending). Feeling nostalgic? This restores the old version 2 task which allows you to see the commits (or a diff) between what is on the server and what is about to be deployed.

### capistrano-ssh-doctor

[capistrano-ssh-doctor](https://github.com/capistrano-plugins/capistrano-ssh-doctor). Having trouble connecting to your servers over SSH? This interesting plugin does not actually affect your deployments in any way. Rather, it is a diagnostic tool to help you troubleshoot problems with your SSH connection to the servers you are deploying to.

Did I miss anything? **What plugins or other techniques are you using in your Capistrano deployments?**
