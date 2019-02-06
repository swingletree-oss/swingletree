import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import { Response, Request, NextFunction } from "express";
import { injectable, inject } from "inversify";

import GithubWebhook from "./github/github-webhook";
import SonarWebhook from "./sonar/sonar-webhook";
import { LOGGER } from "./logger";
import PageRoutes from "./pages/page-routes";
import EventBus from "./event/event-bus";
import { CacheSyncEvent, PerformHealthCheckEvent } from "./event/event-model";
import InstallationStorage from "./github/client/installation-storage";

@injectable()
class SwingletreeServer {
	private githubWebhook: GithubWebhook;
	private sonarWebhook: SonarWebhook;
	private pageRoutes: PageRoutes;
	private eventBus: EventBus;

	constructor(
		@inject(GithubWebhook) githubWebhook: GithubWebhook,
		@inject(SonarWebhook) sonarWebhook: SonarWebhook,
		@inject(PageRoutes) pageRoutes: PageRoutes,
		@inject(EventBus) eventBus: EventBus
	) {
		this.githubWebhook = githubWebhook;
		this.sonarWebhook = sonarWebhook;
		this.pageRoutes = pageRoutes;
		this.eventBus = eventBus;
	}

	public run(app: express.Application) {
		// bootstrap periodic events
		setInterval(() => { this.eventBus.emit(new CacheSyncEvent()); }, InstallationStorage.SYNC_INTERVAL);
		setInterval(() => { this.eventBus.emit(new PerformHealthCheckEvent()); }, 300000);

		// fire initial health check event after initialization grace period
		setTimeout(() => { this.eventBus.emit(new PerformHealthCheckEvent()); }, 10000);

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
		app.locals.filters = this.pageRoutes.filters();

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

		// kickstart everything
		app.listen(app.get("port"), () => {
			LOGGER.info("listening on http://localhost:%d in %s mode", app.get("port"), app.get("env"));
		});
	}
}

export default SwingletreeServer;
