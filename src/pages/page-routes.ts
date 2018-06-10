"use strict";

import { Router, Request, Response, NextFunction } from "express";
import * as express from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../configuration";
import * as BasicAuth from "basic-auth";
import RedisClientFactory, { DATABASE_INDEX } from "../redis-client";
import { LOGGER } from "../logger";

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

		// index page
		router.get("/", (req, res) => {
			res.render("index", {
				unhealthy: this.redisClientFactory.unhealthyConnectionCount(),
				connections: this.redisClientFactory.connectionCount()
			});
		});

		router.use("/static", express.static("static"));

		return router;
	}

}

export default PageRoutes;