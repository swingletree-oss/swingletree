import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import { Response, Request, NextFunction } from "express";
import { injectable, inject } from "inversify";

import GithubWebhook from "./github/github-webhook";
import SonarWebhook from "./sonar/sonar-webhook";
import { LOGGER } from "./logger";
import EventBus from "./event/event-bus";
import GithubClientService from "./github/client/github-client";
import PageRoutes from "./pages/page-routes";
import { AppInstalledEvent } from "./event/event-model";
import { AppsListInstallationsResponseItem } from "@octokit/rest";

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
		LOGGER.info("warming installation cache...");
		this.clientService.getInstallations()
			.then((installations: AppsListInstallationsResponseItem[]) => {
				installations.forEach((installation: AppsListInstallationsResponseItem) => {
					this.eventBus.emit(
						new AppInstalledEvent(
							installation.account.login,
							installation.id
						)
					);
				});
			})
			.catch((err) => {
				try {
					LOGGER.warn("could not update installation cache: %s", JSON.parse(err.message).message);
				} catch (err) {
					LOGGER.warn("could not update installation cache: %s", err.message);
				}
			});

		// kickstart everything
		app.listen(app.get("port"), () => {
			LOGGER.info("listening on http://localhost:%d in %s mode", app.get("port"), app.get("env"));
		});
	}
}

export default SwingletreeServer;
