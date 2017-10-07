import { CommitStatusSender } from "./github/commit-status-sender";
import { GitHubWebhook } from "./github/github-webhook";
import { SonarWebhook } from "./sonar/sonar-webhook";
import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import { EventEmitter } from "events";
import * as path from "path";

import { LOGGER } from "./logger";

const app = express();

// express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// global event bus
const eventBus = new EventEmitter();


// application webhooks with plumbing
const githubWebhook = new GitHubWebhook(eventBus);
const sonarWebhook = new SonarWebhook(eventBus);
const commitStatusSender = new CommitStatusSender(eventBus, process.env.GITHUB_API);

// bind webhooks to paths
app.post("/webhook/github/", githubWebhook.webhook);
app.post("/webhook/sonar/", sonarWebhook.webhook);

// kickstart everything
app.listen(app.get("port"), () => {
	LOGGER.info("listening on http://localhost:%d in %s mode", app.get("port"), app.get("env"));
});

module.exports = app;
