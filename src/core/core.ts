import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import { Response, Request, NextFunction } from "express";
import { injectable, inject } from "inversify";

import GithubWebhook from "./github/github-webhook";
import { LOGGER } from "./logger";
import PageRoutes from "./pages/page-routes";
import EventBus from "./event/event-bus";
import { CacheSyncEvent, PerformHealthCheckEvent } from "./event/event-model";
import InstallationStorage from "./github/client/installation-storage";
import { SwingletreeComponent } from "../component";

class SwingletreeCore extends SwingletreeComponent {
	private app: express.Application;
	private githubWebhook: GithubWebhook;
	private pageRoutes: PageRoutes;
	private eventBus: EventBus;

	constructor(
		app: express.Application,
		githubWebhook: GithubWebhook,
		pageRoutes: PageRoutes,
		eventBus: EventBus
	) {
		super();

		this.app = app;
		this.githubWebhook = githubWebhook;
		this.pageRoutes = pageRoutes;
		this.eventBus = eventBus;
	}

	public start() {
		// bootstrap periodic events
		setInterval(() => { this.eventBus.emit(new CacheSyncEvent()); }, InstallationStorage.SYNC_INTERVAL);
		setInterval(() => { this.eventBus.emit(new PerformHealthCheckEvent()); }, 300000);

		// fire initial health check event after initialization grace period
		setTimeout(() => { this.eventBus.emit(new PerformHealthCheckEvent()); }, 10000);

		// express configuration
		this.app.set("port", process.env.PORT || 3000);
		this.app.use(compression());
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));

		// bind webhooks to paths
		this.app.use("/webhook/github", this.githubWebhook.getRoute());

		// set rendering engine
		this.app.set("view engine", "pug");
		this.app.use("/", this.pageRoutes.getRoute());
		this.app.locals.filters = this.pageRoutes.filters();

		// health endpoint
		this.app.get("/health", (request: Request, response: Response) => {
			response.sendStatus(200);
		});

		// error handling
		this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
			// only provide error details in development mode
			const visibleError = req.app.get("env") === "development" ? err : {};

			res.status(err.status || 500);
			res.send(visibleError);
		});

		// kickstart everything
		this.app.listen(this.app.get("port"), () => {
			LOGGER.info("listening on http://localhost:%d in %s mode", this.app.get("port"), this.app.get("env"));
		});
	}
}

export default SwingletreeCore;
