export enum AppEvent {
	analyzePR = "analyze-pull-request",
	sendStatus = "send-github-commit-status",
	statusSent = "send-github-commit-status-complete",
	webhookEventIgnored = "ignored-webhook-event",
	branchDeleted = "github-branch-deleted",
	sonarProjectDeleted = "sonar-project-deleted",
	appInstalled = "swingletree-app-installed"
}
