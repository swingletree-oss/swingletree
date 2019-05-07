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

	private isWebhookEventRelevant(event: Zap.WebhookMessage) {
		return event.repository !== undefined &&
			event.commitId !== undefined;
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

		if (this.configurationService.getBoolean(ZapConfig.LOG_WEBHOOK_EVENTS)) {
			LOGGER.debug(JSON.stringify(req.body));
		}

		const webhookData: Zap.WebhookMessage = req.body;

		if (this.isWebhookEventRelevant(webhookData)) {
			const coordinates = webhookData.repository.split("/");

			const reportReceivedEvent = new ZapReportReceivedEvent(webhookData.report);
			reportReceivedEvent.commitId = webhookData.commitId;
			reportReceivedEvent.owner = coordinates[0];
			reportReceivedEvent.repository = coordinates[1];

			// check if installation is available
			if (await this.installationStorage.getInstallationId(coordinates[0])) {
				this.eventBus.emit(reportReceivedEvent);
			} else {
				LOGGER.info("ignored zap report for %s/%s. Swingletree may not be installed in this organization.", coordinates[0], coordinates[1]);
			}
		} else {
			LOGGER.debug("zap webhook data did not contain repo and/or commit-sha data. This event will be ignored.");
		}

		res.sendStatus(204);
	}
}

export default ZapWebhook;