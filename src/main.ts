import container from "./ioc-config";

import CommitStatusSender from "./core/github/commit-status-sender";
import GhAppInstallationHandler from "./core/github/app-installation-handler";
import { SonarQubePlugin } from "./sonar/sonar";
import { TemplateEngine } from "./core/template/template-engine";
import SwingletreeCore from "./core/core";
import GithubWebhook from "./core/github/github-webhook";
import PageRoutes from "./core/pages/page-routes";
import EventBus from "./core/event/event-bus";
import { LOGGER } from "./logger";

const express = require("express");

// initialize dangling event handlers
container.get<CommitStatusSender>(CommitStatusSender);
container.get<GhAppInstallationHandler>(GhAppInstallationHandler);

const app = express();

LOGGER.info("starting core component");
const core = new SwingletreeCore(
	app,
	container.get<GithubWebhook>(GithubWebhook),
	container.get<PageRoutes>(PageRoutes),
	container.get<EventBus>(EventBus)
);
core.start();

LOGGER.info("starting sonarqube component");
const sonarPlugin = new SonarQubePlugin(app);
sonarPlugin.start();
