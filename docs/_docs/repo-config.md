---
title: Repository Config
permalink: /docs/repoconf/
redirect_from: /docs/index.html
mermaid: false
---

This page covers the `.swingletree.yml` repository configuration options.

## Purpose

A `.swingletree.yml`...

* is optional
* contains information for Swingletree and Yoke CLI
* contains repository-specific Swingletree plugin configurations
* is located in your repository root


## Schema

A Schema can be used to validate files and assist developers writing a repository configuration:

```yaml
# define schema in your yaml (needs editor support)
$schema: https://swingletree-oss.github.io/swingletree/schema/repo/v1.json

# configuration contents
```
