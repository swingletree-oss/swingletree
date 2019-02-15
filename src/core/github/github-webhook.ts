"use strict";

import { LOGGER } from "../logger";
import { Router } from "express";
import { GithubWebhookEventType, GithubInstallationWebhook } from "./model/gh-webhook-event";

import EventBus from "../event/event-bus";
import { injectable } from "inversify";
import { inject } from "inversify";
import { ConfigurationService } from "../../configuration";
import { AppInstalledEvent } from "../event/event-model";

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
		LOGGER.debug("received GitHub webhook installation event");

		try {
			this.eventBus.emit(
				new AppInstalledEvent(
					data.installation.account.login,
					data.installation.id
				)
			);
		} catch (err) {
			LOGGER.error("failed to emit installation event through event bus", err);
		}
	}

}

export default GithubWebhook;