"use strict";

export enum WebhookEventType {
  pull_request = "pull_request",
  push = "push"
}

export enum PullRequestWebhookAction {
  assigned = "assigned",
  unassigned = "unassigned",
  review_requested = "review_requested",
  review_request_removed = "review_request_removed",
  labeled = "labeled",
  unlabeled = "unlabeled",
  opened = "opened",
  edited = "edited",
  closed = "closed",
  reopened = "reopened"
}

export class GitHubWebhookEvent {
  eventType: WebhookEventType;
  repoName: string;

  static convert(model: any): GitHubWebhookEvent {
    if (model.type === WebhookEventType.pull_request) {
      return new GitHubPullRequestWebhookEvent(model);
    } else if (model.type === WebhookEventType.push) {
      return new GitHubPushWebhookEvent(model);
    }

    return undefined;
  }

  constructor(event: any) {
    this.eventType = event.type;
    this.repoName = event.repo.name;
  }
}

export class GitHubPullRequestWebhookEvent extends GitHubWebhookEvent {
  targetLocation: GitHubLocation;
  sourceLocation: GitHubLocation;
  id: string;
  action: PullRequestWebhookAction;
  merged: boolean;

  constructor(webhookEvent: any) {
    super(webhookEvent);

    const eventPayload: any = webhookEvent.payload;

    this.id = eventPayload.number;
    this.merged = eventPayload.merged,

    this.sourceLocation = new GitHubLocation();
    this.sourceLocation.repositoryPath(eventPayload.head.repo.full_name)
      .reference(eventPayload.head.ref)
      .commitId(eventPayload.head.sha);

    this.targetLocation = new GitHubLocation();
    this.targetLocation.repositoryPath(eventPayload.head.repo.full_name)
      .reference(eventPayload.head.ref)
      .commitId(eventPayload.head.sha);
  }
}

export class GitHubPushWebhookEvent extends GitHubWebhookEvent {
  sourceLocation: GitHubLocation;
  deleted: boolean;

  constructor(webhookEvent: any) {
    super(webhookEvent);

    const eventPayload: any = webhookEvent.payload;

    this.sourceLocation = new GitHubLocation();
    this.sourceLocation.repositoryPath(eventPayload.repository.full_name)
      .reference(eventPayload.ref)
      .commitId(eventPayload.head_commit.id);
  }
}

export class GitHubLocation {
  repo: string;
  ref: string;
  sha: string;

  repositoryPath(path: string): GitHubLocation {
    this.repo = path;
    return this;
  }

  reference(ref: string): GitHubLocation {
    this.ref = ref;
    return this;
  }

  commitId(sha: string): GitHubLocation {
    this.sha = sha;
    return this;
  }
}
