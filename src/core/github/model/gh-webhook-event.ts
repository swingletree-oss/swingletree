/** GitHub Webhook Event types provided by 'X-GitHub-Event' HTTP header
 */
export enum GithubWebhookEventType {
	INSTALLATION = "installation",
	CHECK_SUITE = "check_suite",
	CHECK_RUN = "check_run"
}
