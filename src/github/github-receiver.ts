"use strict";

import { Response, Request, NextFunction } from "express";
import { WebhookEventType, PullRequestWebhookAction, GitHubPullRequestWebhookEvent, GitHubWebhookEvent, GitHubPushWebhookEvent } from "./model/webhook-event";
import { CommitStatusEnum, GitHubCommitStatus } from "./model/commit-status";
import { AppEvent } from "../models/events";
import { Logger } from "../logger";

import events = require("events");


export class GitHubWebhook {
  private logger = Logger.instance;

  eventEmitter: any;

  constructor(eventEmitter: any) {
    this.eventEmitter = eventEmitter;
  }

  private isWebhookEventRelevant(webhookEvent: GitHubWebhookEvent) {
    if (webhookEvent instanceof GitHubPullRequestWebhookEvent) {
      const event: GitHubPullRequestWebhookEvent = webhookEvent;

      return event.action === PullRequestWebhookAction.opened ||
             event.action === PullRequestWebhookAction.reopened;
    } else if (webhookEvent instanceof GitHubPushWebhookEvent) {
      return true;
    }

    return false;
  }

  webhook(req: Request, res: Response) {
    const webhookEvent: GitHubWebhookEvent = GitHubWebhookEvent.convert(req.body);

    this.logger.info("received GitHub webhook event.");

    if (webhookEvent !== undefined && this.isWebhookEventRelevant(webhookEvent)) {
      this.eventEmitter.emit(AppEvent.analyzePR, webhookEvent);
      this.eventEmitter.emit(AppEvent.sendStatus, new GitHubCommitStatus(CommitStatusEnum.pending));
    } else {
      this.eventEmitter.emit(AppEvent.webhookEventIgnored, "github");
    }
  }
}
