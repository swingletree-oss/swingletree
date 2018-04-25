"use strict";

import { LOGGER } from "../logger";
import { Router, Request, Response, NextFunction } from "express";
import { GitHubWebhookEventType, PullRequestWebhookAction, GitHubPullRequestGhWebhookEvent, GitHubWebhookEvent, GitHubPushWebhookEvent, GitHubDeleteWebhookEvent } from "./model/gh-webhook-event";
import { CommitStatusEnum, GitHubGhCommitStatus } from "./model/gh-commit-status";
import { AppEvent } from "../app-events";

import EventBus from "../event-bus";
import { injectable } from "inversify";
import { inject } from "inversify";
import ConfigurationService from "../configuration";

const GithubWebHookHandler = require("express-github-webhook");

/** Provides a GitHub Webhook
 */
@injectable()
class GitHubWebhook {
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

	private isAnalyzeTrigger(webhookEvent: GitHubWebhookEvent): boolean {
		if (webhookEvent.eventType === GitHubWebhookEventType.PUSH || webhookEvent.eventType === GitHubWebhookEventType.PULL_REQUEST) {
			if (webhookEvent instanceof GitHubPullRequestGhWebhookEvent) {
				const event: GitHubPullRequestGhWebhookEvent = webhookEvent;

				return event.action === PullRequestWebhookAction.opened ||
				event.action === PullRequestWebhookAction.reopened;
			} else if (webhookEvent instanceof GitHubPushWebhookEvent) {
				return true;
			}
		}

		return false;
	}

	public getRoute(): Router {
		const webhookHandler = GithubWebHookHandler({ path: "/", secret: this.configService.get().github.webhookSecret });

		// Now could handle following events
		webhookHandler.on("*", this.ghEventHandler.bind(this));

		webhookHandler.on("error", function (err: any, req: any, res: any) {
			LOGGER.warn("failed to process webhook call. " + err);
		});

		const router = Router();
		router.use(webhookHandler);

		return router;
	}

	public ghEventHandler (event: string, repo: string, data: GitHubWebhookEvent) {
		const eventType: GitHubWebhookEventType = event as GitHubWebhookEventType;
		const webhookEvent: GitHubWebhookEvent = GitHubWebhookEvent.convert(eventType, data);

		let eventTriggered: boolean = false;

		LOGGER.info("received GitHub webhook \"%s\" event ", eventType);

		if (webhookEvent !== undefined) {
			if (this.isAnalyzeTrigger(webhookEvent)) {
				this.eventBus.emit(AppEvent.analyzePR, webhookEvent);
				this.eventBus.emit(AppEvent.sendStatus, new GitHubGhCommitStatus(CommitStatusEnum.pending));
				eventTriggered = true;
			} else if (webhookEvent.eventType == GitHubWebhookEventType.INSTALLATION) {
				this.eventBus.emit(AppEvent.appInstalled, webhookEvent);
			}
		}
	}
}

export default GitHubWebhook;