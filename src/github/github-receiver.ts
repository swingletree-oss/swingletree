"use strict";

import { LOGGER } from "../logger";
import { Response, Request, NextFunction } from "express";
import { GitHubWebhookEventType, PullRequestWebhookAction, GitHubPullRequestGhWebhookEvent, GitHubWebhookEvent, GitHubPushGhWebhookEvent } from "./model/gh-webhook-event";
import { CommitStatusEnum, GitHubCommitStatus } from "./model/commit-status";
import { AppEvent } from "../models/events";

import { EventEmitter } from "events";

export class GitHubWebhook {

  eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  private isWebhookEventRelevant(webhookEvent: GitHubWebhookEvent) {
    if (webhookEvent instanceof GitHubPullRequestGhWebhookEvent) {
      const event: GitHubPullRequestGhWebhookEvent = webhookEvent;

      return event.action === PullRequestWebhookAction.opened ||
        event.action === PullRequestWebhookAction.reopened;
    } else if (webhookEvent instanceof GitHubPushGhWebhookEvent) {
      return true;
    }

    return false;
  }

  public webhook = (req: Request, res: Response) => {
    const eventType: GitHubWebhookEventType = <GitHubWebhookEventType>req.header("X-GitHub-Event");
    const webhookEvent: GitHubWebhookEvent = GitHubWebhookEvent.convert(eventType, req.body);

    LOGGER.info("received GitHub webhook \"%s\" event ", eventType);

    if (webhookEvent !== undefined && this.isWebhookEventRelevant(webhookEvent)) {
      this.eventEmitter.emit(AppEvent.analyzePR, webhookEvent);
      this.eventEmitter.emit(AppEvent.sendStatus, new GitHubCommitStatus(CommitStatusEnum.pending));
    } else {
      this.eventEmitter.emit(AppEvent.webhookEventIgnored, "github");
    }
  }
}
