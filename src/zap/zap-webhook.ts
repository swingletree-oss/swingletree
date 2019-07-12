"use strict";

import { Router, Request, Response, NextFunction } from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { ConfigurationService } from "../configuration";
import * as BasicAuth from "basic-auth";
import { LOGGER } from "../logger";
import { ZapConfig } from "./zap-config";
import { Zap } from "./zap-model";
import InstallationStorage from "../core/github/client/installation-storage";
import { ZapReportReceivedEvent } from "./zap-events";

/** Provides a Webhook for Sonar
 */
@injectable()
class ZapWebhook {
	public static readonly IGNORE_ID = "sonar";

	private eventBus: EventBus;
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.installationStorage = installationStorage;
	}

	private isWebhookEventRelevant(event: Zap.Report) {
		return event.site !== undefined;
	}

	private authenticationMiddleware(secret: string) {
		return (req: Request, res: Response, next: NextFunction) => {
			const auth = BasicAuth(req);
			if (auth && secret === auth.pass) {
				next();
			} else {
				res.sendStatus(401);
			}
		};
	}

	public getRoute(): Router {
		const router = Router();
		const secret = this.configurationService.get(ZapConfig.SECRET);

		if (secret && secret.trim().length > 0) {
			router.use(this.authenticationMiddleware(secret));
		} else {
			LOGGER.warn("Zap webhook is not protected. Consider setting a zap secret in the Swingletree configuration.");
		}
		router.post("/", this.webhook);

		return router;
	}

	public webhook = async (req: Request, res: Response) => {
		LOGGER.debug("received Zap webhook event");

		const org = req.query["org"];
		const repo = req.query["repo"];
		const sha = req.query["sha"];

		if (this.configurationService.getBoolean(ZapConfig.LOG_WEBHOOK_EVENTS)) {
			LOGGER.debug(JSON.stringify(req.body));
		}

		const webhookData: Zap.Report = req.body;

		if (org == null || repo == null || sha == null) {
			res.status(400).send("missing at least one of following query parameters: org, repo, sha");
			return;
		}

		if (this.isWebhookEventRelevant(webhookData)) {
			const reportReceivedEvent = new ZapReportReceivedEvent(webhookData, org, repo);
			reportReceivedEvent.commitId = sha;
			reportReceivedEvent.owner = org;
			reportReceivedEvent.repository = repo;

			// check if installation is available
			if (await this.installationStorage.getInstallationId(org)) {
				this.eventBus.emit(reportReceivedEvent);
			} else {
				LOGGER.info("ignored zap report for %s/%s. Swingletree may not be installed in this organization.", org, repo);
			}
		} else {
			LOGGER.debug("zap webhook data did not contain a report. This event will be ignored.");
			res.status(400).send("zap webhook data did not contain a report. This event will be ignored.");
			return;
		}

		res.sendStatus(204);
	}
}

export default ZapWebhook;