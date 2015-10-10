---
title: Automated Rails Deployments with Jenkins and Capistrano
tags:
- capistrano
- rails
- ruby
- jenkins
date: 2014-10-27
url: /blog/automated-rails-deployments-jenkins-capistrano/
menu:
  header:
    parent: 'articles'
---

Continuous integration and continuous deployment are two important elements of building successful web applications. Frequently merging code together and running automated tests tends to result in a healthier code base and improves the ability and speed in which a development team can release features and fix bugs. And, by automating the deployment process, you can ensure that your team can deploy confidently and quickly. In this post, I am going to summarize a quick way to achieve a simple continuous deployment workflow for a Rails application using Capistrano and Jenkins.

<!--more-->

We are using two Jenkins jobs to accomplish this.

{{% figure src="/images/jenkins-jobs.png" alt="Jenkins Jobs" %}}

The first job (Sample App Build) implements the continuous integration phase of the pipeline. In this example, I have a pretty standard build for a Rails application on Jenkins. The single build step looks something like this:

{{< highlight bash >}}
#!/bin/bash -xe
export RAILS_ENV=test
bundle install --deployment --path vendor/bundle
bundle exec rake db:migrate
bundle exec rspec spec --order random --fail-fast
{{< /highlight >}}

The job is triggered to run whenever code is pushed to a specific branch on Github using the [Github Plugin](https://wiki.jenkins-ci.org/display/JENKINS/GitHub+Plugin) and a [Github services webhook](https://developer.github.com/webhooks/#services).

The second job (Sample App Deploy) is responsible for deploying the application via Capistrano. The job is configured to run only after a stable build of the Sample App Build project.

{{% figure src="/images/jenkins-build-trigger.png" alt="Jenkins Build Triggers" %}}

Here is the single build step definition:

{{< highlight bash >}}
#!/bin/bash -xe
bundle exec cap staging deploy
{{< /highlight >}}

One other note on this job: In the Advanced Project Options of the job configuration, I am setting a custom workspace that points the workspace directory to the same directory of the CI job (Sample App Build).

{{% figure src="/images/jenkins-custom-workspace.png" alt="Custom Workspace Configuration" %}}

We could just configure the deployment job to pull the code from Github again but, by reusing the same workspace, we can save a little time and bandwidth. Be aware, though, that this approach might not work if you are aggressively cleaning your workspace directory or if you are building in a distributed environment.

In order to run Capistrano from your Jenkins server, you do need to make sure that SSH authentication is setup correctly. Your Jenkins user will need to be able to pull down your source code from Github (or wherever your source code is hosted). And, you will need to ensure that the Jenkins user is setup with SSH public key authentication to all the servers that Capistrano is going to deploy to.

And, that's it. Now, as soon as a developer pushes code, Jenkins will pull from the Github repository and run the build. If all of the tests pass, the Deploy job will be triggered and the application will be deployed based on the Capistrano recipes.
