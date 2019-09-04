---
title: Fixing Problems
permalink: /docs/problems/
redirect_from: /docs/index.html
---

Each Swingletree instance checks its own health periodically. It displays a Service disruption notice on its web-ui in case of detected issues.
Incidents are also logged to the console.

Health Checks include

* Redis database connectivity
* SonarQube API connectivity

## Common Problems

### Sonar communication disrupted

In case of reported SonarQube connectivity issues, check:

* Authentication token is provided (when SonarQube enforces authentication)
* SonarQube base url is configured

