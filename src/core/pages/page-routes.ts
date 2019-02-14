"use strict";

import { Router, Request, Response, NextFunction } from "express";
import * as express from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../config/configuration";
import HealthService, { HealthState } from "../health-service";

@injectable()
class PageRoutes {
	private configService: ConfigurationService;
	private healthService: HealthService;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(HealthService) healthService: HealthService
		) {
			this.configService = configService;
			this.healthService = healthService;
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
			res.locals.appPublicPage = this.configService.get().github.appPublicPage;
			res.locals.healthStates = this.healthService.getStates(HealthState.DOWN);
			next();
		});

		// index page route
		router.get("/", (req, res) => {
			res.render("index");
		});

		router.get("/code/", (req, res) => {
			res.render("code");
		});

		router.use("/static", express.static("static"));

		return router;
	}

}

export default PageRoutes;