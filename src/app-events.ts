export enum AppEvent {
	analyzePR = "analyze-pull-request",
	statusSent = "send-github-commit-status-complete",
	webhookEventIgnored = "ignored-webhook-event",
	branchDeleted = "github-branch-deleted",
	sonarProjectDeleted = "sonar-project-deleted",
	appInstalled = "swingletree-app-installed",
	sonarAnalysisComplete = "sonar-analysis:complete"
}
