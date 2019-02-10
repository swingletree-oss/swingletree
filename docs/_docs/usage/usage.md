---
title: Usage
permalink: /docs/usage/
redirect_from: /docs/index.html
---

Swingletree needs some context when receiving webhook events from SonarQube. Therefore some additional analysis properties need to be set when running a `sonar-scanner` during your CI build.

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

## More examples

Swingletree Web-UI offers different code snippets specific to your running Swingletree version.