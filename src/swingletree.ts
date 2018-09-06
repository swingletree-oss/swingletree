import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import { Response, Request, NextFunction } from "express";
import { injectable } from "inversify";

import GithubWebhook from "./github/github-webhook";
import SonarWebhook from "./sonar/sonar-webhook";
import { inject } from "inversify";
import { LOGGER } from "./logger";
import EventBus from "./event-bus";
import GithubClientService from "./github/client/github-client";
import { GithubInstallation } from "./github/model/gh-webhook-event";
import PageRoutes from "./pages/page-routes";
import { AppEvent } from "./app-events";

@injectable()
class SwingletreeServer {
	private githubWebhook: GithubWebhook;
	private sonarWebhook: SonarWebhook;
	private clientService: GithubClientService;
	private eventBus: EventBus;
	private pageRoutes: PageRoutes;

	constructor(
		@inject(GithubWebhook) githubWebhook: GithubWebhook,
		@inject(SonarWebhook) sonarWebhook: SonarWebhook,
		@inject(GithubClientService) clientService: GithubClientService,
		@inject(EventBus) eventBus: EventBus,
		@inject(PageRoutes) pageRoutes: PageRoutes
	) {
		this.githubWebhook = githubWebhook;
		this.sonarWebhook = sonarWebhook;
		this.clientService = clientService;
		this.eventBus = eventBus;
		this.pageRoutes = pageRoutes;
	}

	public run(app: express.Application) {
		// express configuration
		app.set("port", process.env.PORT || 3000);
		app.use(compression());
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));

		// bind webhooks to paths
		app.use("/webhook/github", this.githubWebhook.getRoute());
		app.use("/webhook/sonar", this.sonarWebhook.getRoute());

		// set rendering engine
		app.set("view engine", "pug");
		app.use("/", this.pageRoutes.getRoute());

		// health endpoint
		app.get("/health", (request: Request, response: Response) => {
			response.sendStatus(200);
		});

		// error handling
		app.use((err: any, req: Request, res: Response, next: NextFunction) => {
			// only provide error details in development mode
			const visibleError = req.app.get("env") === "development" ? err : {};

			res.status(err.status || 500);
			res.send(visibleError);
		});

		// update installation cache data
		this.clientService.getInstallations()
			.then((installations: GithubInstallation[]) => {
				installations.forEach((installation: GithubInstallation) => {
					this.eventBus.emit(AppEvent.appInstalled, installation);
				});
			})
			.catch((err) => {
				LOGGER.warn("could not update installation cache: " + err.message);
			});

		// kickstart everything
		app.listen(app.get("port"), () => {
			LOGGER.info("listening on http://localhost:%d in %s mode", app.get("port"), app.get("env"));
		});
	}
}

export default SwingletreeServer;
