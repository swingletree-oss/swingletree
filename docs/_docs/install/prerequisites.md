---
title: Prerequisites
permalink: /docs/install/prerequisites/
redirect_from: /docs/index.html
---


Swingletree needs a Redis Database for caching purposes. SonarQube offers a branch analysis feature with its Developer Edition. This is required to
obtain information about the quality of branches in relation to the `master` branch.

* Redis Database (provided with k8s installation)
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
