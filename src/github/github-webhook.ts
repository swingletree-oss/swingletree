"use strict";

import { LOGGER } from "../logger";
import { Router } from "express";
import { GithubWebhookEventType, GithubWebhookEvent, GithubInstallationWebhook, GithubCheckSuiteWebhook } from "./model/gh-webhook-event";
import { AppEvent } from "../app-events";

import EventBus from "../event-bus";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../configuration";

const GithubWebHookHandler = require("express-github-webhook");

/** Provides a GitHub Webhook
 */
@injectable()
class GithubWebhook {
	public static readonly IGNORE_ID = "github";
	private eventBus: EventBus;
	private configService: ConfigurationService;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configService: ConfigurationService
	) {
		this.eventBus = eventBus;
		this.configService = configService;
	}

	public getRoute(): Router {
		if (!this.configService.get().github.webhookSecret) {
			LOGGER.warn("GitHub webhook is not protected. Consider setting a webhook secret in the Swingletree configuration.");
		}

		const webhookHandler = GithubWebHookHandler({ path: "/", secret: this.configService.get().github.webhookSecret });

		webhookHandler.on(GithubWebhookEventType.INSTALLATION, this.installationHandler.bind(this));

		webhookHandler.on("error", function (err: any, req: any, res: any) {
			LOGGER.warn("failed to process webhook call. " + err);
		});

		const router = Router();
		router.use(webhookHandler);

		return router;
	}

	public installationHandler(repo: string, data: GithubInstallationWebhook) {
		LOGGER.info("received GitHub webhook installation event");

		try {
			this.eventBus.emit(AppEvent.appInstalled, data.installation);
		} catch (err) {
			LOGGER.error("failed to emit installation event through event bus", err);
		}
	}

}

export default GithubWebhook;