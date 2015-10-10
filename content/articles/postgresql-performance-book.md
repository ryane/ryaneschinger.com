---
title: "Book recommendation: PostgreSQL 9.0 High Performance"
tags:
- postgresql
date: 2014-10-09
url: /blog/postgresql-performance-book/
menu:
  header:
    parent: 'articles'
---

<div style="float: right;margin-left: 1em;">
<a href="http://www.amazon.com/gp/product/184951030X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=184951030X&linkCode=as2&tag=ryanesc-20&linkId=UPCPHBUE4JKOAP4G"><img border="0" src="http://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=184951030X&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ryanesc-20" alt="asinimage" ></a><img src="http://ir-na.amazon-adsystem.com/e/ir?t=ryanesc-20&l=as2&o=1&a=184951030X" width="1" height="1" border="0" alt="PostgreSQL 9.0 High Performance" style="border:none !important; margin:0px !important;" />
</div>

Lately, I have been working on a reporting system that involves some pretty complex queries against a large data set. I feel like I am reasonably proficient in writing SQL but I've always felt like performance tuning queries was a bit of a dark art. Trying to interpret long and cryptic query plans just made my head hurt. I needed something to help demystify this stuff and I found this book: [PostgreSQL 9.0 High Performance](http://www.amazon.com/gp/product/184951030X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=184951030X&linkCode=as2&tag=ryanesc-20&linkId=UPCPHBUE4JKOAP4G). <!--more-->It is actually not just about query performance optimization - far from it. In fact, the majority of the book covers other aspects of building a high-performance PostgreSQL installation such as:

* a deep dive into hardware including processors, disks, memory and more
* Benchmarking
* Server configuration
* Caching
* Maintenance
* Monitoring
* Replication
* Data Partitioning

To be honest, I did not read a lot of these chapters as they are not applicable to what I am working on right now. But, at a glance, they look to be comprehensive and probably are a great resource if you are responsible for building and managing a PostgreSQL installation. **However, the chapters on Indexing, Query Optimization, and Statistics were worth the price of the book alone**. Although the book is several years old at this point, I think a lot of the concepts it covers are still relevant and practical on newer versions of PostgreSQL. I can't say I'm an expert at query optimization after just reading this book (I think it is a skill that develops with LOTS of practice) but I definitely learned a lot. Now, when it comes to troubleshooting a slow query, I have more direction and feel more confident about solving the problem.
