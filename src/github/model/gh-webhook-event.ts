"use strict";

/** GitHub Webhook Event types provided by 'X-GitHub-Event' HTTP header
 */
export enum GithubWebhookEventType {
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
	synchronize = "synchronize",
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
export class GithubWebhookEvent {
	eventType: GithubWebhookEventType;

	static convert(eventType: GithubWebhookEventType, model: any): GithubWebhookEvent {

		switch (eventType) {
			case GithubWebhookEventType.PULL_REQUEST:
				return new GithubPullRequestGhWebhookEvent(model);
			case GithubWebhookEventType.PUSH:
				return new GithubPushWebhookEvent(model);
			case GithubWebhookEventType.DELETE_BRANCH_TAG:
				return new GithubDeleteWebhookEvent(model);
			case GithubWebhookEventType.INSTALLATION:
				return new GithubInstallation(model.installation);

			default:
				return undefined;
		}
	}

	constructor(eventType: GithubWebhookEventType) {
		this.eventType = eventType;
	}
}

export class GithubInstallation extends GithubWebhookEvent {
	installationId: number;
	applicationId: number;
	login: string;

	constructor(installation: any) {
		super(GithubWebhookEventType.INSTALLATION);

		this.installationId = installation.id;
		this.applicationId = installation.app_id;
		this.login = installation.account.login;
	}
}

export class GithubPullRequestGhWebhookEvent extends GithubWebhookEvent {
	targetLocation: GithubLocation;
	sourceLocation: GithubLocation;
	id: number;
	action: PullRequestWebhookAction;
	merged: boolean;

	constructor(webhookEvent: any) {
		super(GithubWebhookEventType.PULL_REQUEST);

		this.action = webhookEvent.action;
		this.id = webhookEvent.pull_request.number;
		this.merged = webhookEvent.pull_request.merged;

		this.sourceLocation = new GithubLocation();
		this.sourceLocation.repositoryPath(webhookEvent.pull_request.head.repo.full_name)
			.reference(webhookEvent.pull_request.head.ref)
			.commitId(webhookEvent.pull_request.head.sha);

		this.targetLocation = new GithubLocation();
		this.targetLocation.repositoryPath(webhookEvent.pull_request.head.repo.full_name)
			.reference(webhookEvent.pull_request.head.ref)
			.commitId(webhookEvent.pull_request.head.sha);
	}
}

export class GithubDeleteWebhookEvent extends GithubWebhookEvent {
	refType: string;
	ref: string;
	repositoryPath: string;

	constructor(webhookEvent: any) {
		super(GithubWebhookEventType.DELETE_BRANCH_TAG);

		this.refType = webhookEvent.ref_type;
		this.ref = webhookEvent.ref;
		this.repositoryPath = webhookEvent.repository.full_name;
	}
}

export class GithubPushWebhookEvent extends GithubWebhookEvent {
	sourceLocation: GithubLocation;
	deleted: boolean;

	constructor(webhookEvent: any) {
		super(GithubWebhookEventType.PUSH);

		this.sourceLocation = new GithubLocation();
		this.sourceLocation.repositoryPath(webhookEvent.repository.full_name)
			.reference(webhookEvent.ref)
			.commitId(webhookEvent.head_commit.id);
	}
}

export class GithubLocation {
	repo: string;
	ref: string;
	sha: string;

	repositoryPath(path: string): GithubLocation {
		this.repo = path;
		return this;
	}

	reference(ref: string): GithubLocation {
		this.ref = ref;
		return this;
	}

	commitId(sha: string): GithubLocation {
		this.sha = sha;
		return this;
	}
}
