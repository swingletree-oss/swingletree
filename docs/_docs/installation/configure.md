---
title: Configuration
permalink: /docs/configure/
redirect_from: /docs/index.html
---

Swingletree is configured using a configuration file named `swingletree.conf.yaml` or via environment variables, which are listed and described below.

## Environment Variables

### GitHub configuration

| Variable              | Description                                                       | Default |
| --------------------- | ----------------------------------------------------------------- | ------- |
| `GH_APP_PEM`          | Contents will be written to `./gh-app.pem` on startup             | *none*  |
| `GITHUB_APPID`        | Configures the GitHub Application ID                              | *none*  |
| `GITHUB_BASE`         | Configures the GitHub API base URL (useful for GitHub Enterprise) | *none*  |
| `GITHUB_SECRET`       | Configures the GitHub webhook secret                              | *none*  |
| `GITHUB_KEY_FILE`     | A path pointing to the GitHub App private key file                | *none*  |
| `GITHUB_APP_PAGE`     | *(optional)* Points to the GitHub App public page. The value can be found on the GitHub App configuration page. | *none* |

### Sonar configuration

| Variable              | Description                                                       | Default |
| --------------------- | ----------------------------------------------------------------- | ------- |
| `SONAR_SECRET`        | Enables and sets the Basic Authentication password for the Swingletree SonarQube webhook. | *none* |
| `SONAR_BASE`          | SonarQube base url (for example `http://sonarhost:9000`)          | *none*  |
| `SONAR_TOKEN`         | SonarQube API token                                               | *none*  |

### Database configuration

| Variable              | Description                                                       | Default |
| --------------------- | ----------------------------------------------------------------- | ------- |
| `DATABASE_HOST`       | Sets the Redis database host                                      | *none*  |
| `DATABASE_PASSWORD`   | Sets the Redis database password to use for authentication        | *none*  |

### Application configuration

| Variable              | Description                                                       | Default |
| --------------------- | ----------------------------------------------------------------- | ------- |
| `PORT`                | Sets the port Swingletree is listening on.                        | `3000`  |
| `LOG_LEVEL`           | Sets the log level.                                               | `info`  |
| `LOG_DISABLE_COLORS`  | Disables colors in log messages if set to `true`.                 | `false` |
| `LOG_FORMAT`          | Sets the log format. Can be `json`, `logstash` or `text`          | `text`  |