---
title: Scotty
permalink: /docs/components/scotty/
redirect_from: /docs/index.html
---

Scotty handles communications with Swingletree backends, like GitHub or ElasticSearch.

## Features

* Retrieves and caches `.swingletree.yml` repository configuration files
* Manages GitHub App authentication
* Sends Analysis Reports to GitHub using Check Run API
* Sends Analysis states to Gitea using Commit Status API
* Persists Analysis Reports to ElasticSearch