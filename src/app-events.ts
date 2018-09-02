export enum AppEvent {
	statusSent = "github:status-sent",
	githubPushEvent = "github:push",
	webhookEventIgnored = "github:webhook-event-ignored",
	appInstalled = "github:app-installed",
	sonarAnalysisComplete = "sonar:analysis-complete"
}
