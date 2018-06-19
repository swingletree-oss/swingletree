# Swingletree

Enforce SonarQube Quality Gates inside your GitHub Pull Requests.


## Intention

Tracking your code quality across your branches is a good thing - especially when it comes to approving pull requests.

Swingletree gives you the possibility to block pull requests on failing quality gates performed by the [SonarQube Branch Plugin][sonar-branch-plugin]. The commit status is also updated, if findings are marked as, for example, `false-positive` or `won't fix` in SonarQube.

## Integration

Swingletree integrates into SonarQube using webhooks. No need to install and update plugins on your SonarQube instance!

![Activity Diagram](./docs/swingletree-flow.png)

Swingletree integrates itself as a GitHub App, which spares you some configuration work and does not require a technical user.
Teams will only need to install Swingletree as a GitHub App on GitHub organizations they intend to use it.

Swingletree will request a permission to modify your repositories' commit statuses to be able to attach the SonarQube analysis status.

> ![Commit Status](./docs/commit-status.png)

### Webhook URLs

Swingletree publishes webhook endpoints for SonarQube and GitHub webhook events.

If you do not care about setting a `pending` commit status on GitHub `push` events, you can skip adding Swingletree as a GitHub organization (or repository) webhook.
This may be useful in case you have repositories inside your organization, which do not utilize SonarQube in their build pipelines.

| Type      | Path            | Content Type       |            |                          |
| --------- | --------------- | ------------------ | ---------- | ------------------------ |
| SonarQube | webhook/sonar   |                    | required   | [How-to][sonar-webhook]  |
| GitHub    | webhook/github  | `application/json` | *optional* | [How-to][github-webhook] |

#### SonarQube Webhook security

Swingletree's SonarQube webhook can be configured to be protected by basic authentication. You can set the secret via environment variable or inside the configuration file. If you do not configure this value, the webhook can be used without providing authentication. Keep in mind you should use `https` (by using for example a reverse proxy) to protect your credentials.

### SonarQube Analysis Parameters

Swingletree needs some context when receiving webhook events from SonarQube. Therefore some parameters need to be set when running a SonarQube analysis during your CI build.

* `sonar.analysis.commitId`, containing the commit id
* `sonar.analysis.repository`, containing the full repository path

You can set the parameters when invoking the `sonar-scanner`. For example:

```
sonar-scanner \
    -Dsonar.analysis.commitId=628f5175ada0d685fd7164baa7c6382c1f25cab4 \
    -Dsonar.analysis.repository=error418/swingletree
```


## Configuration

Swingletree is configured using a configuration file named `swingletree.conf.yaml` or via environment variables, which are listed and described below.

### Environment Variables

| Variable              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `GH_APP_PEM`          | Variable contents will be written to `./gh-app.pem` on startup  |
| `GITHUB_APPID`        | Configures the GitHub Application ID |
| `GITHUB_BASE`         | Configures the GitHub API base URL  |
| `GITHUB_SECRET`       | Configures the GitHub webhook secret  |
| `GITHUB_APP_PAGE`     | *(optional)* Points to the GitHub App public page. The value can be found on the GitHub App configuration page. |
| `DATABASE_HOST`       | Sets the Redis database host  |
| `DATABASE_PASSWORD`   | Sets the Redis database password to use for authentication |
| `SONAR_SECRET`        | Enables and sets the Basic Authentication password for the SonarQube webhook. |
| `PORT`                | Sets the port Swingletree is listening on. Defaults to `3000` |
| `LOG_LEVEL`           | Sets the log level. Defaults to `info` |
| `LOG_DISABLE_COLORS`  | Disables colors in log messages if set to `true`. Defaults to `false` |
| `CONFIG`              | (not recommended) If set the variable contents will be written to `./swingletree.conf.yaml` on startup. This needs to be a plain string. |

### GitHub App Configuration

In case you want to run your own Swingletree you will need to create a GitHub App on Github.com (or your GitHub Enterprise instance). Follow the instructions on this [GitHub Guide][create-gh-app] to create one.

#### GitHub App Private Key

You will notice that a private key file named `gh-app.pem` (by default) is required on startup. Swingletree needs this file to authenticate with GitHub.

After you have created your GitHub App, you can generate and download the key from the App configuration page.

#### Permissions

When creating your GitHub App you will need to specify the permissions required by the App. If the permissions are not granted, Swingletree will not be able to operate properly.

Read and Write access are required for `Commit Statuses`


## Run

Swingletree can be run from source or by using Docker.

To be able to run Swingletree following prerequisites must be met:
* NodeJS 8 or later
* Redis 4 or later

### Running with Docker

Swingletree comes with an `docker-compose` file, which should mainly be used for development purposes.
Start Swingletree and a Redis database by running `docker-compose up` in the Swingletree directory.

You will still need to configure your Swingletree instance via [environment variables](#environment-variables).

### Running from source

Start swingletree by installing your dependencies with `npm i --production` and run the application by `npm start`
Configure by editing the `swingletree.config.yaml`.

## Build

Swingletree is built using a build container. By running `docker build .` you can start building Swingletree along with its container image. In case you need to use a npm registry proxy you can override the default NPM registry by defining the docker build argument `NPM_REGISTRY` (for example `docker build --build-arg NPM_REGISTRY=http://my.npm.registry/` ). Be aware that you will download the npm dependencies for each build.

If you don't want to get all that fancy and just want to build Swingletree without its image you can still run a plain `npm run build`.

[create-gh-app]: https://developer.github.com/apps/building-github-apps/creating-a-github-app/
[sonar-webhook]: https://docs.sonarqube.org/display/SONAR/Webhooks
[sonar-branch-plugin]: https://docs.sonarqube.org/display/PLUG/Branch+Plugin
[github-webhook]: https://developer.github.com/webhooks/creating/#setting-up-a-webhook
