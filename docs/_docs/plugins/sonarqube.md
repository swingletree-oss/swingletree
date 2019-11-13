---
title: Sonarqube Plugin
permalink: /docs/components/sonarqube/
redirect_from: /docs/index.html
---

Swingletree needs some context when receiving webhook events from SonarQube. Therefore some additional analysis properties need to be set when running a `sonar-scanner` during your CI build.

## Features

The Swingletree SonarQube Plugin offers following functionalities:

* Attaches SonarQube findings to Pull Request via GitHub Check Run annotations

Processed data is persisted to ElasticSearch (if enabled) and can be processed to reports using Kibana or Grafana.


## General CI build configuration

* `sonar.analysis.commitId`, containing the commit id
* `sonar.analysis.repository`, containing the full repository path

You can set the parameters when invoking the `sonar-scanner`. For example:

```
sonar-scanner \
    -Dsonar.analysis.commitId=628f5175ada0d685fd7164baa7c6382c1f25cab4 \
    -Dsonar.analysis.repository=error418/swingletree
```

Of course these values (at least `commitId`) need to be acquired dynamically on each build.

## Reference branch analysis

A reference branch can be set by providing the SonarQube property `sonar.branch.target`.
SonarQube will run the branch analysis in relation to the provided branch name.

## Repository-specific Configuration

Repository-specific behaviour can be configured by placing a `.swingletree.yaml` in the repository root directory. Swingletree reads from the master branch file only.

Swingletree fails on any findings, if no `.swingletree.yaml` is available in the repository.

```yaml
plugin:
  sonar:
    # if true: require developer action if coverage is declining
    blockCoverageLoss: false
```

| Property | Description | Default |
| --- | --- | --- |
| `blockCoverageLoss` | require developer action on coverage loss | `false` |


## More examples

Swingletree Web-UI offers different code snippets specific to your currently deployed Swingletree version.