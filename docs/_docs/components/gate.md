---
title: Gate
permalink: /docs/components/gate/
redirect_from: /docs/index.html
---

Gate provides API endpoints of Swingletree.

## Features

* Provides metadata information to Swingletree plugins
* Registers and manages plugin endpoints
* Authenticates API calls (if auth token is configured)

## Plugin routing

Gate is the entrance for communicating with the running Swingletree plugins. Plugin endpoints are published under the path `/report/[plugin name]` (removing the `plugin-` prefix).

Gate will check authentication (if configured) and initially prepare the request for consumption by the plugin.
