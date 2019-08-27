"use strict";

import { Router, Request, Response, NextFunction } from "express";
import * as express from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import HealthService, { HealthState } from "../health-service";
import { CoreConfig } from "../core-config";
import { HistoryService } from "../history/history-service";
import { LOGGER } from "../../logger";

@injectable()
class PageRoutes {
	private healthService: HealthService;
	private historyService: HistoryService;

	private publicPageUrl: string;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(HealthService) healthService: HealthService,
		@inject(HistoryService) historyService: HistoryService
		) {
			this.publicPageUrl = configService.get(CoreConfig.Github.APP_PUBLIC_PAGE);
			this.healthService = healthService;
			this.historyService = historyService;
	}

	public filters(): any {
		return {
			"code": function (text: string, options: any) {
				return `<pre><code class="language-${options.lang}">${require("pug").runtime.escape(text)}</code></pre>`;
			}
		};
	}

	public getRoute(): Router {
		const router = Router();

		// set locals for all pages
		router.use("/", (req: Request, res: Response, next: NextFunction) => {
			res.locals.appPublicPage = this.publicPageUrl;
			res.locals.healthStates = this.healthService.getStates(HealthState.DOWN);
			res.locals.moment = require("moment");
			next();
		});

		// index page route
		router.get("/", (req, res) => {
			res.render("index");
		});

		router.get("/code/", (req, res) => {
			res.render("code");
		});

		router.get("/builds", (req, res) => {
			Promise.all([
				this.historyService.getOrgs(),
				this.historyService.getLatest()
			]).then((data) => {
				res.locals.orgs = data[0];
				res.locals.builds = data[1];
				console.log(res.locals.builds.hits.total);
					res.render("overview");
				})
				.catch((err) => {
					LOGGER.warn("failed to render build overview");
					LOGGER.warn(err);
				});
		});

		router.get("/api/builds", (req, res) => {
			this.historyService.getLatest()
				.then((data) => {
					res.send(data.hits);
				})
				.catch((err) => {
					LOGGER.debug(err);
					res.status(500).send();
				});
		});

		router.use("/static", express.static("static"));

		return router;
	}

}

export default PageRoutes;