---
title: Ansible Quick Start - A Brief Introduction
tags:
- ansible
- devops
date: 2014-09-26
url: /blog/ansible-quick-start/
menu:
  header:
    parent: 'articles'
optin: "Do you want to read more about Ansible and other devops practices and tools? Sign up below for my newsletter."
optinbutton: "I want to learn more"
---

Recently, I have been working with [Ansible](http://www.ansible.com/home), an IT automation, configuration management and provisioning tool along the same lines as [Chef](https://www.getchef.com/chef/) and [Puppet](http://puppetlabs.com/). If you are responsible for managing servers - even if it is just one - you would be well served to learn one of these tools.

<!--more-->

## Why Ansible?

And, more generally, why use a configuration management tool at all? Anyone with an operations or development background have surely had to log into a server to change a configuration option, install a package, restart a service, or something else. It is easy enough to log in via SSH, make a quick change to get your application working, and then log out again. I know that I have done this hundreds (maybe thousands?) of times over my career. Sometimes, I would be diligent and document that change. More often, I would not. Then, weeks or months later, I would run into the same problem and have to rack my brain to remember how I fixed it. After resorting to scouring Google for answers, I'll find the solution, slap my forehead, and then proceed to make the same exact change over again. This process may get you by for a time but there is definitely a better way. Especially in this day and age with the proliferation of cloud computing and cheap, disposable virtual machines, the ability to manage servers in a fast, repeatable and consistent manner is of paramount importance.

As mentioned above, there are a variety of tools that can help. But, there is definitely a barrier to entry, especially if you are just managing a handful of servers and don't have the resources to spend a lot of time learning new tools. Chef and Puppet are fantastic and can be used to manage extremely large infrastructures but there is no denying that they have a large learning curve and can be difficult to setup and configure (at least in my experience). Ansible aims to be simpler and easier to understand while still maintaining the efficiency and power of other tools. It uses an agentless architecture so you don't have to bootstrap your machines with a client application. And, it uses a simple configuration file format that is easy to understand and read for sysadmins and developers alike. Finally, Ansible unifies remote execution and configuration management - some other solutions require separate tools for these tasks. So, let's take a look.

In order to follow along, you will need at least one server you can play around with. If you don't have one, you can use [Vagrant](http://www.vagrantup.com/) to spin up a virtual machine or two to work with. Another option I also like to use is [DigitalOcean](https://www.digitalocean.com/) - it is an easy, low cost way to work with virtual machines in the cloud. You will also need a machine to run Ansible on. If you are running Linux or OSX, you should be good to go. As far as I know, Ansible will not run (easily) on Windows.

## Installation

If you are on OSX, the easiest way to get Ansible installed is to use [Homebrew](http://brew.sh/).

{{< highlight bash >}}
$ brew update
$ brew install ansible
{{< /highlight >}}

On Ubuntu 14.04 (Trusty Tahr), you can run the following commands to get a recent version of Ansible:

{{< highlight bash >}}
$ sudo apt-get install software-properties-common
$ sudo apt-add-repository ppa:ansible/ansible
$ sudo apt-get update
$ sudo apt-get install ansible
{{< /highlight >}}

For other options and more details on how to install Ansible on other releases and platforms, you should consult the [Ansible Installation documentation](http://docs.ansible.com/intro_installation.html).

## Inventory File

Ansible uses an inventory file to determine what hosts to work against. In its simplest form, an inventory file is just a text file containing a list of host names or IP addresses - one on each line. For example:

    192.168.0.20
    192.168.0.21
    192.168.0.22

The inventory file acually uses the INI format and has a lot more capabilities than just a flat list of hosts. It supports things like specifying aliases, SSH ports, name patterns, groups, and variables. For more details, check out the [inventory docs](http://docs.ansible.com/intro_inventory.html). For our purposes, we just need a simple list of hosts.

By default, Ansible looks for an inventory file at <code>/etc/ansible/hosts</code>. I like to be more explicit about this, especially when experimenting, and specify the path to an inventory file that I am working with. Most Ansible commands support passing in an option like <code>--inventory=/path/to/inventory/file</code>. We will see more of this later. For now, create a text file called <code>inventory.ini</code> wherever you like and add the host name or IP address of the server or servers you want to manage with Ansible.

## Testing Connectivity

As mentioned above, Ansible depends on SSH access to the servers you are managing. If you are able to use access your servers via SSH then you should be able to manage them with Ansible. Ansible works best when you have SSH public key authentication configured so that you don't have to use passwords to access your hosts. For the rest of this post, I am going to assume that this is the case but Ansible does have options for specifying passwords in its commands (run <code>man ansible</code> for details). It also assumes that you are going to be authenticating with the current user name who is running the commands. If this is not the case, you can pass <code>--user=username</code> or <code>-u username</code> to tell it to use a specific user. In these examples, I am working on newly provisioned DigitalOcean servers and need to authenticate as the <code>root</code> user.

Let's verify we have everything setup correctly and we can connect to our host(s).

{{< highlight bash >}}
$ ansible all --inventory-file=inventory.ini --module-name ping -u root
{{< /highlight >}}

{{% note %}}
<strong>Note</strong>: If you are using a Vagrant virtual machine, you are likely going to have to modify the command above. If you are using a typical Vagrant base box, you will likely want to authenticate with a user named <em>vagrant</em> and a different private key. For example, on my Vagrant virtual machine (using base box "ubuntu/trusty64"), the command I use is:

{{< highlight bash >}}
$ ansible all --inventory-file=inventory.ini --module-name ping -u vagrant --private-key=~/.vagrant.d/insecure_private_key
{{< /highlight >}}

You can run <code>vagrant ssh-config</code> to get more details about the options needed to successfully SSH into your Vagrant virtual machine. There are ways to configure the inventory file so that you don't have to use such an unwieldy command line that I can cover in a future post.
{{% /note %}}

Also, note that I am running Ansible in the same directory as my inventory file (inventory.ini). If you aren't, or if you named your inventory file something different, just adjust the inventory file path in the command.

You may get a prompted to accept the host key first if you haven't connected to these servers over SSH before.

    The authenticity of host '104.129.22.241 (104.129.22.241)' can't be established.
    RSA key fingerprint is 0c:71:ca:a5:e9:f2:4d:60:9d:2e:01:c3:b8:09:75:50.
    Are you sure you want to continue connecting (yes/no)? yes

If everything works, you should see some output like the following:

{{< highlight bash >}}
104.129.3.148 | success >> {
    "changed": false,
    "ping": "pong"
}

104.129.22.241 | success >> {
    "changed": false,
    "ping": "pong"
}
{{< /highlight >}}

If something went wrong, you may see something like:

    104.129.3.148 | FAILED => SSH encountered an unknown error during the connection. We recommend you re-run the command using -vvvv, which will enable SSH debugging output to help diagnose the issue

This means Ansible was unable to connect to your host(s) for some reason. As mentioned in the output, adding <code>-vvvv</code> will usually point you in the right direction.

So, let's dissect that command a bit. The first argument, <code>all</code> simply tells Ansible to run against all hosts defined in the inventory file. You can use this first argument to target a specific host, group, wildcard pattern or a combination of all of those things. For our purposes, we will just be using <code>all</code> going forward. We mentioned the  <code>--inventory</code> option earlier - it just lets you specify a path to the inventory file. If you don't include this, Ansible will look for an inventory file at /etc/ansible/hosts. There is a shorter version of this option: <code>-i inventory.ini</code> which we will use from now on. Next, is the module name: <code>--module-name ping</code>. We'll talk about Ansible [modules](#ansible-modules) below but just know that, in this example, we are calling the *ping* module which simply returns "pong" if successful. This is a useful, side-effect free way of checking that we can connect and manage our hosts with Ansible.

You can shorten the <code>--module-name</code> argument to just <code>-m</code>. For example:

{{< highlight bash >}}
$ ansible all -i inventory.ini -m ping -u root
{{< /highlight >}}

## <a name="ansible-modules"></a>Ansible Modules

[Modules](http://docs.ansible.com/modules.html) are Ansible's way of abstracting certain system management or configuration tasks. In many ways, this is where the real power in Ansible lies. By abstracting commands and state into modules, Ansible is able to make system management [idempotent](http://en.wikipedia.org/wiki/Idempotence). This is an important concept that makes configuration management tools like Ansible much more powerful and safe than something like a typical shell script. It is challenging enough to write a shell script that can configure a system (or lots of systems) to a specific state. It is extremely challenging to write one that can be run repeatedly against the same systems and not break things or have unintended side effects. When using idempotent modules, Ansible can safely be run against the same systems again and again without failing or making any changes that it does not need to make.

There is a large catalog of [modules](http://docs.ansible.com/modules_by_category.html) available for Ansible out of the box. Here are just a very small sample of some things that can be managed with Ansible modules:

* users
* groups
* packages
* ACLs
* files
* apache modules
* firewall rules
* ruby gems
* git repositories
* mysql and postgresql databases
* docker images
* AWS / Rackspace / Digital Ocean instances
* Campfire or Slack notifications
* and a whole lot more.

If there is not a specific module available to accomplish a certain task, you can also just run arbitrary commands with Ansible or you can create your own [custom module](http://docs.ansible.com/developing_modules.html).

## Remotely Executing AdHoc Commands

Ansible allows you to remotely execute commands against your managed hosts. This is a powerful capability so queue the "With great power comes great responsibility" quote. For the most part, you are going to want to package your system management tasks into [Playbooks](#playbooks) (see below). But, if you do need to run an arbitrary command against your hosts, Ansible has your back. Let's take a quick look at the uptime on all of our hosts:

{{< highlight bash >}}
$ ansible all -i inventory.ini -m command -u root --args "uptime"
104.131.20.249 | success | rc=0 >>
 17:51:27 up 1 day, 10:26,  1 user,  load average: 0.00, 0.01, 0.05

104.131.3.142 | success | rc=0 >>
 17:51:27 up 1 day, 10:26,  1 user,  load average: 0.00, 0.01, 0.05
{{< /highlight >}}

Cool. In this example, we are using the *command* module to run an arbitrary command against the host. We use <code>--args</code> to pass the command line we want to execute. As usual, this command can be shortened a bit:

{{< highlight bash >}}
$ ansible all -i inventory.ini -u root -a "uptime"
{{< /highlight >}}

It turns out that *command* is the default module that Ansible will use when you run it. And <code>-a</code> is a shorter alias for <code>--args</code>.

How about another example?

{{< highlight bash >}}
$ ansible all -i inventory.ini -m apt -u root -a "name=zsh state=installed"
104.131.3.142 | success >> {
    "changed": true,
    "stderr": "update-alternatives: warning: skip creation of /usr/share/man/man1/rzsh.1.gz because associated file /usr/share/man/man1/zsh.1.gz (of link group rzsh) doesn't exist\n",
    "stdout": "Reading package lists...\nBuilding dependency tree...\nReading state information...\nThe following extra packages will be installed:\n  zsh-common\nSuggested packages:\n  zsh-doc\nThe following NEW packages will be installed:\n  zsh zsh-common\n0 upgraded, 2 newly installed, 0 to remove and 50 not upgraded.\nNeed to get 2,726 kB of archives.\nAfter this operation, 11.4 MB of additional disk space will be used.\nGet:1 http://mirrors.digitalocean.com/ubuntu/ trusty/main zsh-common all 5.0.2-3ubuntu6 [2,119 kB]\nGet:2 http://mirrors.digitalocean.com/ubuntu/ trusty/main zsh amd64 5.0.2-3ubuntu6 [607 kB]\nFetched 2,726 kB in 0s (7,801 kB/s)\nSelecting previously unselected package zsh-common.\n(Reading database ... 90913 files and directories currently installed.)\nPreparing to unpack .../zsh-common_5.0.2-3ubuntu6_all.deb ...\nUnpacking zsh-common (5.0.2-3ubuntu6) ...\nSelecting previously unselected package zsh.\nPreparing to unpack .../zsh_5.0.2-3ubuntu6_amd64.deb ...\nUnpacking zsh (5.0.2-3ubuntu6) ...\nProcessing triggers for man-db (2.6.7.1-1) ...\nSetting up zsh-common (5.0.2-3ubuntu6) ...\nSetting up zsh (5.0.2-3ubuntu6) ...\nupdate-alternatives: using /bin/zsh5 to provide /bin/zsh (zsh) in auto mode\nupdate-alternatives: using /bin/zsh5 to provide /bin/rzsh (rzsh) in auto mode\n"
}

104.131.20.249 | success >> {
    "changed": true,
    "stderr": "",
    "stdout": "Reading package lists...\nBuilding dependency tree...\nReading state information...\nSuggested packages:\n  zsh-doc\nThe following NEW packages will be installed:\n  zsh\n0 upgraded, 1 newly installed, 0 to remove and 12 not upgraded.\nNeed to get 4,716 kB of archives.\nAfter this operation, 11.7 MB of additional disk space will be used.\nGet:1 http://mirrors.digitalocean.com/ubuntu/ precise/main zsh amd64 4.3.17-1ubuntu1 [4,716 kB]\nFetched 4,716 kB in 0s (12.3 MB/s)\nSelecting previously unselected package zsh.\r\n(Reading database ... \r(Reading database ... 5%\r(Reading database ... 10%\r(Reading database ... 15%\r(Reading database ... 20%\r(Reading database ... 25%\r(Reading database ... 30%\r(Reading database ... 35%\r(Reading database ... 40%\r(Reading database ... 45%\r(Reading database ... 50%\r(Reading database ... 55%\r(Reading database ... 60%\r(Reading database ... 65%\r(Reading database ... 70%\r(Reading database ... 75%\r(Reading database ... 80%\r(Reading database ... 85%\r(Reading database ... 90%\r(Reading database ... 95%\r(Reading database ... 100%\r(Reading database ... 113275 files and directories currently installed.)\r\nUnpacking zsh (from .../zsh_4.3.17-1ubuntu1_amd64.deb) ...\r\nProcessing triggers for man-db ...\r\nSetting up zsh (4.3.17-1ubuntu1) ...\r\nupdate-alternatives: using /bin/zsh4 to provide /bin/zsh (zsh) in auto mode.\r\nupdate-alternatives: using /bin/zsh4 to provide /bin/rzsh (rzsh) in auto mode.\r\nupdate-alternatives: using /bin/zsh4 to provide /bin/ksh (ksh) in auto mode.\r\n"
}
{{< /highlight >}}

In this example, I use the [apt module](http://docs.ansible.com/apt_module.html) to ensure that [Zsh](http://www.zsh.org/) is installed.

{{% note %}}
<strong>Note</strong>: In the examples in this post, I am using the <em>root</em> account which has all of the necessary privileges to run this and the following examples. This is not necessarily a best practice (it is common to block the <em>root</em> user from logging in via SSH). If you are authenticating with a user that does not have root privileges but does have <em>sudo</em> access, you should append <code>--sudo</code> or <code>-s</code> to the command line (as well as changing <code>-u</code> to specify the correct user name). Here is what the command looks like when running against a Vagrant virtual machine:

{{< highlight bash >}}
$ ansible all -i inventory.ini -m apt -u vagrant -a "name=zsh state=installed -s"
{{< /highlight >}}

And, if you need to specify a <em>sudo</em> password, you can use the <code>--ask-sudo-pass</code> or <code>-K</code> option.
{{% /note %}}

One final example:

{{< highlight bash >}}
$ ansible all -i inventory.ini -u root -m user -a "name=arch comment='Arch Stanton' shell=/usr/bin/zsh generate_ssh_key=yes ssh_key_bits=2048"

104.131.3.142 | success >> {
    "changed": true,
    "comment": "Arch Stanton",
    "createhome": true,
    "group": 1001,
    "home": "/home/arch",
    "name": "arch",
    "shell": "/usr/bin/zsh",
    "ssh_fingerprint": "2048 e6:52:dc:c3:c6:ec:98:dd:01:1a:54:0d:d5:b5:94:f7  ansible-generated (RSA)",
    "ssh_key_file": "/home/arch/.ssh/id_rsa",
    "ssh_public_key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDYNQi/NeehCgS1Apv+Oha+No1FEzGqDVF1PIAAz+lfy1egxs/MaJRfkx2cLiht3riJwGER/CEFGehzB6f7cSbNx7oyK5Sj/aPUEJhiHwIi7Ev28LcteAB4JqMmCO08zgUZd6oJ57stKBVb7esCSLvwQvuFaxtBhYxyIGBov2KMSRDy9KwNXUaLed7qWV7auPWn5lq98APOJ/cjNNLHpYTR/N3iJH1VwmSb2XxrfCFrEx/bpcfKPr97SKpufH6cYuuD/zaXNd43M4QYO6rPY/idWBW8f06rbYFBdrXaLt6C/OIbbv5GWf/ZJ4g0nSo5dzp9knv9EymZ8s2U1e3v0ic1 ansible-generated",
    "state": "present",
    "system": false,
    "uid": 1001
}

104.131.20.249 | success >> {
    "changed": true,
    "comment": "Arch Stanton",
    "createhome": true,
    "group": 1002,
    "home": "/home/arch",
    "name": "arch",
    "shell": "/usr/bin/zsh",
    "ssh_fingerprint": "2048 0b:1d:6a:9a:7a:1d:56:c3:26:d6:2a:90:1c:2d:15:18  ansible-generated (RSA)",
    "ssh_key_file": "/home/arch/.ssh/id_rsa",
    "ssh_public_key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDr6FCafN7b7QbB3f8itzN7fDcpU5OAnyvpc0HICfP/vxv9Cxr3EHIQCOLXFeXjtUBSQ6iyR17ceVe4n6xyiqrLJqjdsoDZFgwF5fZjTXFUY0/00srq7Bd0Ihm+AyHTYfXzM2dfVLy/l5/NQ4vwsez8FTh23Ef5FungY68dMs1VjsYnbu3ddg3IUEH4CADveIVhvcx9EQ/EBJvKsBIUjoDxPfC8uBNt8kx9h3TQvmIx8+Ydrn5lFEpyHWZGtlIoduWdHlH4cfN0NQaFhzJnalgeiem76C78pZ/YJ2wkNNXoFMveTNAu873a9kepSlHtRSZ1ND1c/xWV0KJX3DsQ7QTt ansible-generated",
    "state": "present",
    "system": false,
    "uid": 1002
}

{{< /highlight >}}

Here I created a new user, generated an SSH key for that user, and set their shell to Zsh. As you can see, you can use Ansible to perform pretty sophisticated operations across multiple hosts really rapidly.

## <a name="playbooks"></a>Playbooks

[Playbooks](http://docs.ansible.com/playbooks.html) allow you to organize your configuration and management tasks in simple, human-readable files. Each playbook contains a list of tasks ('plays' in Ansible parlance) and are defined in a [YAML](http://www.yaml.org/) file. Playbooks can be combined with other playbooks and organized into [Roles](http://docs.ansible.com/playbooks_roles.html) which allow you to define sophisticated infrastructures and then easily provision and manage them. Playbooks and roles are large topics so I encourage you to read the [docs](http://docs.ansible.com/playbooks_roles.html). But, let's look at a quick example playbook. I want to create myself a user account on all of my servers. Furthermore, I want to be able to authenticate using my personal SSH key and I want to use Zsh as my shell. For my Zsh config, I am going to use the great [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) framework.

{{< highlight yaml >}}
---
- hosts: all
  tasks:
    - name: Ensure Zsh is installed
      apt: name=zsh state=installed

    - name: Ensure git is installed
      apt: name=git state=installed

    - name: Create my user account
      user: name=ryan shell=/usr/bin/zsh

    - name: Add my public key to the server
      authorized_key: user=ryan
                      key="{{ lookup('file', '~/.ssh/id_rsa.pub') }}"

    - name: Install oh-my-zsh
      git: repo=https://github.com/robbyrussell/oh-my-zsh.git
           dest=~/.oh-my-zsh
      remote_user: ryan
      sudo: false

    - name: Copy .zshrc template
      command: cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
      remote_user: ryan
      sudo: false

{{< /highlight >}}

{{% note %}}
***Update** Nov 22, 2014*: see my [post]({{< relref "articles/2014-11-22-ensuring-command-module-task-is-repeatable-with-ansible.md" >}}) about updating the *Copy .zshrc template* task to be idempotent and safely repeatable.
{{% /note %}}

Hopefully, you should be able to understand exactly what is going to happen just by scanning the file. If not, this is what we are going to accomplish with this playbook.

1. We install the Zsh package
2. We install git which we will need to clone the *oh-my-zsh* repository.
3. We create my user account and we set my shell to Zsh
4. We use the [authorized_key module](http://docs.ansible.com/authorized_key_module.html) and a [file lookup](http://docs.ansible.com/playbooks_lookups.html) to copy my public key to the servers.
5. We use the [git module](http://docs.ansible.com/git_module.html) to clone the *oh-my-zsh* repository.
6. We use the [command module](http://docs.ansible.com/command_module.html) to copy the example zsh config to my user's ~/.zshrc

The last two plays are interesting. Note we use the *remote_user* option to specify that we want to run these tasks as the new *ryan* user. We also override any *sudo* option passed in from the *ansible-playbook* command. This means I don't have to worry about adding plays to fix file permissions and ownership which I probably would have to do if I run those tasks as root. This does depend on the ability of the *ryan* account to login via SSH (which we configured in step 4.).

Ok, cool, now let's try it out. The command to run playbooks is *ansible-playbook*. It shares a lot of options with the *ansible* command so most of this should look familiar:

{{< highlight bash >}}
$ ansible-playbook myuser.yml -i inventory.ini -u root

PLAY [all] ********************************************************************

GATHERING FACTS ***************************************************************
ok: [104.131.3.142]
ok: [104.131.20.249]

TASK: [Ensure Zsh is installed] ***********************************************
changed: [104.131.3.142]
changed: [104.131.20.249]

TASK: [Ensure git is installed] ***********************************************
changed: [104.131.3.142]
changed: [104.131.20.249]

TASK: [Create my user account] ************************************************
changed: [104.131.20.249]
changed: [104.131.3.142]

TASK: [Add my public key to the server] ***************************************
changed: [104.131.20.249]
changed: [104.131.3.142]

TASK: [Install oh-my-zsh] *****************************************************
changed: [104.131.3.142]
changed: [104.131.20.249]

TASK: [Copy .zshrc template] **************************************************
changed: [104.131.3.142]
changed: [104.131.20.249]

PLAY RECAP ********************************************************************
104.131.20.249             : ok=7    changed=6    unreachable=0    failed=0
104.131.3.142              : ok=7    changed=6    unreachable=0    failed=0
{{< /highlight >}}

Sweet! I can now SSH into my hosts with my *ryan* account, using public key authentication, and I have an awesome shell environment already configured. The command we used should look familiar. The first argument is the file path to the playbook we are running. In this case, *newuser.yml*. The <code>-i</code> and <code>-u</code> options are the same as we have seen before with the *ansible* command. And, feel free to run the playbook again (and again). You won't hurt anything (unless you make a change to the ~/.zshrc file in between runs - this part could be improved but I'll leave that as an exercise to the reader).

## Facts, Variables, Roles, Vault, etc.

There is a lot more to Ansible than I can cover in this introduction. We really just scratched the surface. If you are interested, you should definitely checkout some of the resources I listed below. And, please, if there is something you would like me to cover on this blog, please [let me know](mailto:ryanesc@gmail.com)!

## Resources

* [Ansible Docs](http://docs.ansible.com/index.html)
* [Ansible Galaxy](https://galaxy.ansible.com/) - Find pre-built playbook roles from the community.
* [Mailing List](https://groups.google.com/forum/#!forum/ansible-project)

{{< optinform >}}
