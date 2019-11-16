---
title: Installation
permalink: /docs/installation/
redirect_from: /docs/index.html
---

This section covers the installation of an on-premise Swingletree.

## Prerequisites

Swingletree needs a Redis Database for caching purposes. SonarQube offers a branch analysis feature with its Developer Edition. This is required to
obtain information about the quality of branches in relation to the `master` branch.

* Redis Database
* GitHub or GitHub Enterprise

If you intend to use ElasticSearch to store your analysis reports you will need

* ElasticSearch 7.x

### Plugin Prerequisites

* SonarQube Plugin
  * Sonarqube Developer Edition (minimum)
  * Version 7.x (tested with 7.6)
* Zap Plugin
  * *No dependencies*
* Twistlock Plugin
  * *No dependencies* 

## Kubernetes

Swingletree is intended to be installed into a Kubernetes cluster. Use the provided `bake.sh` script in the `helm` directory and deploy the resulting manifest.
Make sure to configure Swingletree by editing `helm/swingletree/values.yaml` or `bake.sh --configure` before baking your deployment manifest.

## Preparation

1. Create Swingletree GitHub App
  * Retrieve GitHub App Id
  * Retrieve GitHub App private key file
  * Set permissions (See section below)
2. Configure Plugins according to their documentation

## GitHub Application

In case you want to run your own Swingletree you will need to create a GitHub App on Github.com (or your GitHub Enterprise instance). Follow the instructions on this [GitHub Guide][create-gh-app] to create one.

### Permissions

When creating your GitHub App you will need to specify the permissions required by the App. If the permissions are not granted, Swingletree will not be able to operate properly.

* Read and Write access are required for `Checks`
* Read access is required for `Contents`

### GitHub App Private Key

You will notice that a private key file named `gh-app.pem` (by default) is required on startup. Swingletree needs this file to authenticate with GitHub.

After you have created your GitHub App, you can generate and download the key from the App configuration page.


[create-gh-app]: https://developer.github.com/apps/building-github-apps/creating-a-github-app/
