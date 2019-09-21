---
title: Gradle Nebula Plugin
permalink: /docs/components/nebula/
redirect_from: /docs/index.html
---

[Nebula][nebula] is a collection of plugins for Gradle. The [Gradle Metrics Plugin][gradle-metrics] provides metrics to a webservice endpoint after each build by Gradle.

Swingletree can provide a webservice endpoint to process the metics report of the plugin.

## Features

The Swingletree Plugin offers following functionalites:

* Collects information about tests running in your Gradle build
* Collects performance metrics of your builds
* Collects general information about your build
  * Gradle version
  * Java version
  * Project version
  * Project name

Processed data is persisted to ElasticSearch (if enabled) and can be processed to reports using Kibana or Grafana.

### Build Status decision

Swingletree blocks Pull Requests if tests are failing in the Gradle build.

## Sending a metrics report to Swingletree

The Nebula webhook is published when the Nebula Plugin is enabled.
It accepts a Nebula Gradle Metrics Plugin report as a payload and needs some additional http headers to link the report to a GitHub repository:

```groovy
buildscript {
  dependencies {
    classpath "com.netflix.nebula:gradle-metrics-plugin:9.0.1"
  }
}

if (thisIsCiBuild) { // needs to be specified by you
  apply plugin: "nebula.metrics"

  metrics {
      dispatcherType = 'REST'
      restUri = 'https://swingletree/webhook/nebula' // can be injected by CI server using properties or env vars

      // header values need to be extracted and set
      headers['X-swingletree-org'] = <GitHub Organization>
      headers['X-swingletree-repo'] = <GitHub Repository Name>
      headers['X-swingletree-sha'] = <Git commit sha>
      headers['X-swingletree-branch'] = <Git branch>
  }
}
```

It is recommended to protect your webhook endpoint. If you enabled webhook protection you will need to provide the authentication credentials via Basic Authentication. The CI server can pass the credentials using inline credentials in the `restUri`-property (like `https://webhook:secret@swingletreeurl/webhook/nebula`)

Swingletree will process the report and send a Check Run Status with the context `gradle/nebula` to the given GitHub coordinates.


[nebula]: https://nebula-plugins.github.io/
[gradle-metrics]: https://github.com/nebula-plugins/gradle-metrics-plugin