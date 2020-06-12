---
title: Preparation
permalink: /docs/install/prepare/
redirect_from: /docs/index.html
---

This section covers the preparation steps to perform before installing Swingletree.

Create Swingletree GitHub App
  * Retrieve GitHub App Id
  * Retrieve GitHub App private key file
  * Set permissions (See section below)

### GitHub Application

In case you want to run your own Swingletree you will need to create a GitHub App on Github.com (or your GitHub Enterprise instance). Follow the instructions on this [GitHub Guide][create-gh-app] to create one.

#### Permissions

When creating your GitHub App you will need to specify the permissions required by the App. If the permissions are not granted, Swingletree will not be able to operate properly.

* Read and Write access are required for `Checks`
* Read access is required for `Single File`, set `Path` to `.swingletree.yml`

#### GitHub App Private Key

You will notice that a private key file named `gh-app.pem` (by default) is required on startup. Swingletree needs this file to authenticate with GitHub.

After you have created your GitHub App, you can generate and download the key from the App configuration page.

[create-gh-app]: https://developer.github.com/apps/building-github-apps/creating-a-github-app/
