"use strict";

import { Router, Request, Response, NextFunction } from "express";
import * as express from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../config/configuration";
import RedisClientFactory from "../db/redis-client";

@injectable()
class PageRoutes {
	private configService: ConfigurationService;
	private redisClientFactory: RedisClientFactory;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(RedisClientFactory) redisClientFactory: RedisClientFactory
		) {
			this.configService = configService;
			this.redisClientFactory = redisClientFactory;
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
			next();
		});

		// index page route
		router.get("/", (req, res) => {
			const healthStates: Health[] = [];
			if (this.redisClientFactory.unhealthyConnectionCount() > 0) {
				healthStates.push({
					state: HealthState.DOWN,
					service: "redis",
					detail: `${this.redisClientFactory.unhealthyConnectionCount()} of ${this.redisClientFactory.connectionCount()} clients have connectivity issues`
				});
			}
			res.render("index", {
				healthStates: healthStates
			});
		});

		router.get("/code", (req, res) => {
			res.render("code", {});
		});

		router.use("/static", express.static("static"));

		return router;
	}

}

interface Health {
	state: HealthState;
	service: string;
	detail?: string;
}

enum HealthState {
	UP,
	DOWN
}

export default PageRoutes;