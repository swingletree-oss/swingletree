import { GetInstallationsResponseItem } from "@octokit/rest";

"use strict";

/** GitHub Webhook Event types provided by 'X-GitHub-Event' HTTP header
 */
export enum GithubWebhookEventType {
	INSTALLATION = "installation",
	CHECK_SUITE = "check_suite",
	CHECK_RUN = "check_run"
}

/** Superclass of a GitHub Webhook event
 */
export interface GithubWebhookEvent {
	eventType: GithubWebhookEventType;
}

export interface GithubInstallationWebhook extends GithubWebhookEvent {
	action: "created" | "deleted";
	installation: GetInstallationsResponseItem;
}

export interface GithubInstallation extends GetInstallationsResponseItem {

}

export interface GithubAccount {
	/** name of user or organization */
	login: string;
	type: string;
}

export interface GithubCheckRunWebhook extends GithubWebhookEvent {
	action: "created" | "rerequested" | "requested_action";
	check_run: GithubCheckRun;
}

export interface GithubCheckRun {
	id: number;
	head_sha: string;
	url: string;
	html_url: string;
	status: "queued" | "in_progress" | "completed";
	conclusion?: CheckConclusion;
	name: string;
}

export interface GithubCheckSuiteWebhook extends GithubWebhookEvent {
	action: "completed" | "requested" | "rerequested";
	check_suite: GithubCheckSuite;
}

export interface GithubCheckSuite {
	id: number;
	head_branch: string;
	head_sha: string;
	status: "requested" | "in_progress" | "completed";
	conclusion: CheckConclusion;
}

export enum CheckConclusion {
	SUCCESS = "success",
	FAILURE = "failure",
	NEUTRAL = "neutral",
	CANCELLED = "cancelled",
	TIMEOUT = "timed_out",
	ACTION_REQUIRED = "action_required"
}
