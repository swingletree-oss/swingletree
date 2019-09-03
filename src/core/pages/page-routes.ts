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
import { query } from "winston";

@injectable()
class PageRoutes {
	private healthService: HealthService;
	private historyService: HistoryService;

	private readonly isBuildHistoryEnabled: boolean;

	private publicPageUrl: string;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(HealthService) healthService: HealthService,
		@inject(HistoryService) historyService: HistoryService
		) {
			this.publicPageUrl = configService.get(CoreConfig.Github.APP_PUBLIC_PAGE);
			this.healthService = healthService;
			this.historyService = historyService;

			this.isBuildHistoryEnabled = historyService.isEnabled();
	}

	public filters(): any {
		return {
			"code": function (text: string, options: any) {
				return `<pre><code class="language-${options.lang}">${require("pug").runtime.escape(text)}</code></pre>`;
			}
		};
	}

	private componentIcon(componentId: string) {
		switch (componentId) {
			case "security/twistlock": return "shield-alt";
			case "security/zap": return "crosshairs";
			case "sonarqube": return "bug";
		}

		return "question";
	}

	public getRoute(): Router {
		const router = Router();

		// set locals for all pages
		router.use("/", (req: Request, res: Response, next: NextFunction) => {
			res.locals.appPublicPage = this.publicPageUrl;
			res.locals.healthStates = this.healthService.getStates(HealthState.DOWN);
			res.locals.isBuildHistoryEnabled = this.isBuildHistoryEnabled;

			res.locals.componentIcon = this.componentIcon;
			res.locals.moment = require("moment");
			next();
		});

		// index page route
		router.get("/", (req, res) => {
			res.locals.basePath = ".";

			res.render("index");
		});

		router.get("/code/", (req, res) => {
			res.locals.basePath = "..";

			res.render("code");
		});

		if (this.historyService.isEnabled()) {
			router.get("/builds", (req, res) => {
				req.query.page = parseInt(req.query.page, 10);
				const queryPage = (isNaN(req.query.page)) ? 0 : req.query.page;

				const pageSize = 20;
				const fromIndex = pageSize * queryPage;

				res.locals.basePath = "..";

				Promise.all([
					this.historyService.getOrgs(),
					this.historyService.getLatest(fromIndex, pageSize)
				]).then((data) => {
						res.locals.orgs = data[0];
						res.locals.builds = data[1];

						res.locals.paging = {
							total: data[1].hits.total.value,
							pages: Math.ceil(data[1].hits.total.value / pageSize),
							pageSize: pageSize,
							current: queryPage
						};

						res.render("builds");
					})
					.catch((err) => {
						LOGGER.warn("failed to render build overview");
						LOGGER.warn(err);
						console.log(err);
					});
			});
		}

		router.use("/static", express.static("static"));

		return router;
	}

}

export default PageRoutes;