import CommitStatusSender from "./github/commit-status-sender";
import GithubWebhook from "./github/github-webhook";
import SonarWebhook from "./sonar/sonar-webhook";
import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as path from "path";
import { Response, Request } from "express";

import { LOGGER } from "./logger";
import ConfigurationService from "./configuration";
import { injectable } from "inversify";
import { inject } from "inversify";
import EventBus from "./event-bus";

@injectable()
class SwingletreeServer {
	private configurationService: ConfigurationService;
	private githubWebhook: GithubWebhook;
	private sonarWebhook: SonarWebhook;

	constructor(
		@inject(GithubWebhook) githubWebhook: GithubWebhook,
		@inject(SonarWebhook) sonarWebhook: SonarWebhook,
		@inject(ConfigurationService) configurationService: ConfigurationService
	) {
		this.githubWebhook = githubWebhook;
		this.sonarWebhook = sonarWebhook;
		this.configurationService = configurationService;
	}

	public run(app: any) {
		// express configuration
		app.set("port", process.env.PORT || 3000);
		app.use(compression());
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));

		// bind webhooks to paths
		app.post("/webhook/github/", this.githubWebhook.webhook);
		app.post("/webhook/sonar/", this.sonarWebhook.webhook);


		// health endpoint
		app.get("/health", (request: Request, response: Response) => {
			response.sendStatus(200);
		});

		// kickstart everything
		app.listen(app.get("port"), () => {
			LOGGER.info("listening on http://localhost:%d in %s mode", app.get("port"), app.get("env"));
		});
	}
}

export default SwingletreeServer;
