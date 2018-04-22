"use strict";

import { LOGGER } from "../logger";
import { Response, Request, NextFunction } from "express";
import { GitHubWebhookEventType, PullRequestWebhookAction, GitHubPullRequestGhWebhookEvent, GitHubWebhookEvent, GitHubPushWebhookEvent, GitHubDeleteWebhookEvent } from "./model/gh-webhook-event";
import { CommitStatusEnum, GitHubGhCommitStatus } from "./model/gh-commit-status";
import { AppEvent } from "../app-events";

import EventBus from "../event-bus";
import { injectable } from "inversify";
import { inject } from "inversify";

/** Provides a GitHub Webhook
 */
@injectable()
class GitHubWebhook {
	public static readonly IGNORE_ID = "github";

	private eventBus: EventBus;

	constructor(
		@inject(EventBus) eventBus: EventBus
	) {
		this.eventBus = eventBus;
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

	public webhook = (req: Request, res: Response) => {
		const eventType: GitHubWebhookEventType = <GitHubWebhookEventType>req.header("X-GitHub-Event");
		const webhookEvent: GitHubWebhookEvent = GitHubWebhookEvent.convert(eventType, req.body);

		let eventTriggered: boolean = false;

		LOGGER.info("received GitHub webhook \"%s\" event ", eventType);

		if (webhookEvent !== undefined) {
			if (this.isAnalyzeTrigger(webhookEvent)) {
				this.eventBus.emit(AppEvent.analyzePR, webhookEvent);
				this.eventBus.emit(AppEvent.sendStatus, new GitHubGhCommitStatus(CommitStatusEnum.pending));
				eventTriggered = true;
			}
		}

		if (!eventTriggered) {
			this.eventBus.emit(AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
		}

		res.sendStatus(204);
	}
}

export default GitHubWebhook;