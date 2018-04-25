"use strict";

import { LOGGER } from "../logger";
import { Router, Request, Response, NextFunction } from "express";
import { GithubWebhookEventType, PullRequestWebhookAction, GithubPullRequestGhWebhookEvent, GithubWebhookEvent, GithubPushWebhookEvent, GithubDeleteWebhookEvent } from "./model/gh-webhook-event";
import { CommitStatusEnum, GithubCommitStatus } from "./model/gh-commit-status";
import { AppEvent } from "../app-events";

import EventBus from "../event-bus";
import { injectable } from "inversify";
import { inject } from "inversify";
import ConfigurationService from "../configuration";

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

	private isAnalyzeTrigger(webhookEvent: GithubWebhookEvent): boolean {
		if (webhookEvent.eventType === GithubWebhookEventType.PUSH ||
			webhookEvent.eventType === GithubWebhookEventType.PULL_REQUEST) {
			if (webhookEvent instanceof GithubPullRequestGhWebhookEvent) {
				const event: GithubPullRequestGhWebhookEvent = webhookEvent;

				return event.action === PullRequestWebhookAction.opened ||
						event.action === PullRequestWebhookAction.reopened ||
						event.action === PullRequestWebhookAction.synchronize;
			} else if (webhookEvent instanceof GithubPushWebhookEvent) {
				return true;
			}
		}

		return false;
	}

	public getRoute(): Router {
		const webhookHandler = GithubWebHookHandler({ path: "/", secret: this.configService.get().github.webhookSecret });

		webhookHandler.on("*", this.ghEventHandler.bind(this));

		webhookHandler.on("error", function (err: any, req: any, res: any) {
			LOGGER.warn("failed to process webhook call. " + err);
		});

		const router = Router();
		router.use(webhookHandler);

		return router;
	}

	public ghEventHandler (event: string, repo: string, data: GithubWebhookEvent) {
		const eventType: GithubWebhookEventType = event as GithubWebhookEventType;
		const webhookEvent: GithubWebhookEvent = GithubWebhookEvent.convert(eventType, data);

		let eventTriggered: boolean = false;

		LOGGER.info("received GitHub webhook \"%s\" event ", eventType);

		if (webhookEvent !== undefined) {
			if (this.isAnalyzeTrigger(webhookEvent)) {
				this.eventBus.emit(AppEvent.analyzePR, webhookEvent);
				this.eventBus.emit(AppEvent.sendStatus, new GithubCommitStatus(CommitStatusEnum.pending));
				eventTriggered = true;
			} else if (webhookEvent.eventType == GithubWebhookEventType.INSTALLATION) {
				this.eventBus.emit(AppEvent.appInstalled, webhookEvent);
			} else {
				LOGGER.info("webhook event was ignored.");
			}
		}
	}
}

export default GithubWebhook;