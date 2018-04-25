"use strict";

/** GitHub Webhook Event types provided by 'X-GitHub-Event' HTTP header
 */
export enum GitHubWebhookEventType {
	PULL_REQUEST = "pull_request",
	PUSH = "push",
	DELETE_BRANCH_TAG = "delete",
	INSTALLATION = "installation"
}

/** Pull Request Event 'action' types
 */
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

/** Superclass of a GitHub Webhook event
 */
export class GitHubWebhookEvent {
	eventType: GitHubWebhookEventType;

	static convert(eventType: GitHubWebhookEventType, model: any): GitHubWebhookEvent {

		switch (eventType) {
			case GitHubWebhookEventType.PULL_REQUEST:
				return new GitHubPullRequestGhWebhookEvent(model);
			case GitHubWebhookEventType.PUSH:
				return new GitHubPushWebhookEvent(model);
			case GitHubWebhookEventType.DELETE_BRANCH_TAG:
				return new GitHubDeleteWebhookEvent(model);
			case GitHubWebhookEventType.INSTALLATION:
				return new GhInstallation(model.installation);

			default:
				return undefined;
		}
	}

	constructor(eventType: GitHubWebhookEventType) {
		this.eventType = eventType;
	}
}

export class GhInstallation extends GitHubWebhookEvent {
	installationId: number;
	applicationId: number;
	login: string;

	constructor(installation: any) {
		super(GitHubWebhookEventType.INSTALLATION);

		this.installationId = installation.id;
		this.applicationId = installation.app_id;
		this.login = installation.account.login;
	}
}

export class GitHubPullRequestGhWebhookEvent extends GitHubWebhookEvent {
	targetLocation: GitHubLocation;
	sourceLocation: GitHubLocation;
	id: number;
	action: PullRequestWebhookAction;
	merged: boolean;

	constructor(webhookEvent: any) {
		super(GitHubWebhookEventType.PULL_REQUEST);

		this.action = webhookEvent.action;
		this.id = webhookEvent.pull_request.number;
		this.merged = webhookEvent.pull_request.merged;

		this.sourceLocation = new GitHubLocation();
		this.sourceLocation.repositoryPath(webhookEvent.pull_request.head.repo.full_name)
			.reference(webhookEvent.pull_request.head.ref)
			.commitId(webhookEvent.pull_request.head.sha);

		this.targetLocation = new GitHubLocation();
		this.targetLocation.repositoryPath(webhookEvent.pull_request.head.repo.full_name)
			.reference(webhookEvent.pull_request.head.ref)
			.commitId(webhookEvent.pull_request.head.sha);
	}
}

export class GitHubDeleteWebhookEvent extends GitHubWebhookEvent {
	refType: string;
	ref: string;
	repositoryPath: string;

	constructor(webhookEvent: any) {
		super(GitHubWebhookEventType.DELETE_BRANCH_TAG);

		this.refType = webhookEvent.ref_type;
		this.ref = webhookEvent.ref;
		this.repositoryPath = webhookEvent.repository.full_name;
	}
}

export class GitHubPushWebhookEvent extends GitHubWebhookEvent {
	sourceLocation: GitHubLocation;
	deleted: boolean;

	constructor(webhookEvent: any) {
		super(GitHubWebhookEventType.PUSH);

		this.sourceLocation = new GitHubLocation();
		this.sourceLocation.repositoryPath(webhookEvent.repository.full_name)
			.reference(webhookEvent.ref)
			.commitId(webhookEvent.head_commit.id);
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
