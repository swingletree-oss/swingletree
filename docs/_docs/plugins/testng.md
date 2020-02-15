---
title: TestNG Plugin
permalink: /docs/plugins/testng/
redirect_from: /docs/index.html
---

[TestNG](https://testng.org/doc/) is a testing framework. Test results can be aggregated to a xml report, which this plugin is able to read.

## Features

The Swingletree TestNG Plugin offers following functionalities:

* Extracts and attaches information from TestNG reports to Commits and Pull-Requests in GitHub.

Processed data is persisted to ElasticSearch (if enabled) and can be processed to reports using Kibana or Grafana.

## Sending a scan report to Swingletree

<div class="well well-sm">
  Yoke CLI can be used to send a TestNG report. See the docs covering yoke to learn how to send reports with ease.
</div>

A Swingletree webhook is published when the TestNG Plugin is enabled.
It accepts a TestNG report in XML format as a payload and needs some additional query parameters to link the report to a GitHub repository:

```
POST /report/testng?org=[GitHub Organization]&repo=[Repository name]&sha=[Commit SHA]&branch=[branch]
```

It is recommended to protect your webhook endpoint. If you enabled webhook protection you will need to provide the authentication credentials via Basic Authentication.

Swingletree will process the report and send a Check Run Status with the context `test/testng` to the given GitHub coordinates.