"use strict";

import { Response, Request, NextFunction } from "express";
import { WebhookEventType, PullRequestWebhookAction, GitHubPullRequestGhWebhookEvent, GitHubGhWebhookEvent, GitHubPushGhWebhookEvent } from "./model/gh-webhook-event";
import { CommitStatusEnum, GitHubCommitStatus } from "./model/commit-status";
import { AppEvent } from "../models/events";
import { Logger } from "../logger";
import { EventEmitter } from "events";

export class GitHubWebhook {
  private logger = Logger.instance;

  eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  private isWebhookEventRelevant(webhookEvent: GitHubGhWebhookEvent) {
    if (webhookEvent instanceof GitHubPullRequestGhWebhookEvent) {
      const event: GitHubPullRequestGhWebhookEvent = webhookEvent;

      return event.action === PullRequestWebhookAction.opened ||
             event.action === PullRequestWebhookAction.reopened;
    } else if (webhookEvent instanceof GitHubPushGhWebhookEvent) {
      return true;
    }

    return false;
  }

  webhook(req: Request, res: Response) {
    const webhookEvent: GitHubGhWebhookEvent = GitHubGhWebhookEvent.convert(req.body);

    this.logger.info("received GitHub webhook event.");

    if (webhookEvent !== undefined && this.isWebhookEventRelevant(webhookEvent)) {
      this.eventEmitter.emit(AppEvent.analyzePR, webhookEvent);
      this.eventEmitter.emit(AppEvent.sendStatus, new GitHubCommitStatus(CommitStatusEnum.pending));
    } else {
      this.eventEmitter.emit(AppEvent.webhookEventIgnored, "github");
    }
  }
}
