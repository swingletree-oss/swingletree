---
title: Yoke CLI
permalink: /docs/yoke-cli/
redirect_from: /docs/index.html
---

Yoke is the CLI of Swingletree, providing a simple and convenient way of publishing build reports.

## Features

* Retrieves current Git information and annotates it to the report
* Reads the `.swingletree.yml` repository configuration

## Usage

Print help by running `yoke -h`. A report should be published after all build steps have finished and the report data is avaiable to yoke.

```
yoke publish -e https://gate.swingletree.domain
```

### Swingletree Repo Config

Yoke picks the plugins and report locations from the `.swingletree.yml` of the repository.

A configuration could look like this:

```yml
yoke:
  reports:
    - plugin: zap
      contenttype: application/json
      report: build/zap/report.json
    - plugin: twistlock
      contenttype: application/json
      report: build/twistlock/report.json
```

Yoke would try to send the report contents of

* `build/zap/report.json` to the `zap` plugin endpoint of Gate
* `build/twistlock/report.json` to the `twistlock` plugin endpoint of Gate