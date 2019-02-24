"use strict";

import { LOGGER } from "../../logger";
import { Router } from "express";
import { GithubWebhookEventType, GithubInstallationWebhook } from "./model/gh-webhook-event";

import EventBus from "../event/event-bus";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { AppInstalledEvent, AppDeinstalledEvent } from "../event/event-model";
import { CoreConfig } from "../core-config";

const GithubWebHookHandler = require("express-github-webhook");

/** Provides a GitHub Webhook
 */
@injectable()
class GithubWebhook {
	public static readonly IGNORE_ID = "github";
	private eventBus: EventBus;
	private webhookSecret: string;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configService: ConfigurationService
	) {
		this.eventBus = eventBus;
		this.webhookSecret = configService.get(CoreConfig.Github.WEBHOOK_SECRET);
	}

	public getRoute(): Router {
		if (!this.webhookSecret) {
			LOGGER.warn("GitHub webhook is not protected. Consider setting a webhook secret in the Swingletree configuration.");
		}

		const webhookHandler = GithubWebHookHandler({ path: "/", secret: this.webhookSecret });

		webhookHandler.on(GithubWebhookEventType.INSTALLATION, this.installationHandler.bind(this));

		webhookHandler.on("error", function (err: any, req: any, res: any) {
			LOGGER.warn("failed to process webhook call. " + err);
		});

		const router = Router();
		router.use(webhookHandler);

		return router;
	}

	public installationHandler(repo: string, data: GithubInstallationWebhook) {
		LOGGER.debug("received GitHub webhook installation event");

		try {
			if (data.action == "created") {
				this.eventBus.emit(
					new AppInstalledEvent(
						data.installation
					)
				);
			} else if (data.action == "deleted") {
				this.eventBus.emit(
					new AppDeinstalledEvent(
						data.installation
					)
				);
			}
		} catch (err) {
			LOGGER.error("failed to emit installation event through event bus", err);
		}
	}

}

export default GithubWebhook;