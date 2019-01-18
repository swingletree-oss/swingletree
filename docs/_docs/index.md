---
title: General
permalink: /docs/home/
redirect_from: /docs/index.html
---

# Swingletree

## Setup

Swingletree can be run with multiple instances. A redis database is used as a common cache.
A cache refresh is triggered when a specific cache flag entry is absent in the redis database.

## Startup

A Swingletree instance performs following actions when starting up:

1. Check if a cache refresh is required
    * Query GitHub for installations
    * update cache with retrieved installations
    * set cache flag

![startup flow](../../assets/images/startup-flow.png)