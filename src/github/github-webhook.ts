"use strict";

import { LOGGER } from "../logger";
import { Response, Request, NextFunction } from "express";
import { GitHubWebhookEventType, PullRequestWebhookAction, GitHubPullRequestGhWebhookEvent, GitHubWebhookEvent, GitHubPushWebhookEvent, GitHubDeleteWebhookEvent } from "./model/gh-webhook-event";
import { CommitStatusEnum, GitHubGhCommitStatus } from "./model/gh-commit-status";
import { AppEvent } from "../models/app-events";

import { EventEmitter } from "events";

export class GitHubWebhook {

	eventEmitter: EventEmitter;

	constructor(eventEmitter: EventEmitter) {
		this.eventEmitter = eventEmitter;
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

	private isDeleteTrigger(webhookEvent: GitHubWebhookEvent): boolean {
		if (webhookEvent.eventType === GitHubWebhookEventType.DELETE_BRANCH_TAG) {
			const deleteEvent = <GitHubDeleteWebhookEvent>webhookEvent;

			return deleteEvent.refType === "branch" ;
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
				this.eventEmitter.emit(AppEvent.analyzePR, webhookEvent);
				this.eventEmitter.emit(AppEvent.sendStatus, new GitHubGhCommitStatus(CommitStatusEnum.pending));
				eventTriggered = true;
			}

			if (this.isDeleteTrigger(webhookEvent)) {
				this.eventEmitter.emit(AppEvent.webhookEventIgnored, "github");
				eventTriggered = true;
			}
		}

		if (!eventTriggered) {
			this.eventEmitter.emit(AppEvent.webhookEventIgnored, "github");
		}
	}
}
