export enum AppEvent {
	statusSent = "send-github-commit-status-complete",
	githubPushEvent = "github:push",
	webhookEventIgnored = "ignored-webhook-event",
	branchDeleted = "github-branch-deleted",
	sonarProjectDeleted = "sonar-project-deleted",
	appInstalled = "swingletree-app-installed",
	sonarAnalysisComplete = "sonar-analysis:complete"
}
