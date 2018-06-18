"use strict";

import { Router, Request, Response, NextFunction } from "express";
import * as express from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../configuration";
import RedisClientFactory from "../redis-client";

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

	public getRoute(): Router {
		const router = Router();

		// set locals for all pages
		router.use("/", (req: Request, res: Response, next: NextFunction) => {
			res.locals.appPublicPage = this.configService.get().github.appPublicPage;
			next();
		});

		// index page route
		router.get("/", (req, res) => {
			res.render("index", {
				unhealthy: this.redisClientFactory.unhealthyConnectionCount(),
				connections: this.redisClientFactory.connectionCount(),
			});
		});

		router.use("/static", express.static("static"));

		return router;
	}

}

export default PageRoutes;