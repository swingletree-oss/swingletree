"use strict";

import { LOGGER } from "../logger";
import { GithubWebhookEventType, GithubWebhookEvent, GithubPushWebhookEvent } from "./model/gh-webhook-event";
import { AppEvent } from "../app-events";
import { CommitStatusEnum } from "./model/gh-commit-status";
import GithubClientService from "./client/github-client";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { injectable, inject } from "inversify";
import { ConfigurationService } from "../configuration";
import EventBus from "../event-bus";
import { ChecksCreateParams } from "@octokit/rest";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class CommitStatusSender {

	private configurationService: ConfigurationService;
	private githubClientService: GithubClientService;
	private eventBus: EventBus;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(GithubClientService) githubClientService: GithubClientService
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;

		this.eventBus.register(AppEvent.sonarAnalysisComplete, this.sendAnalysisStatus, this);

		this.githubClientService = githubClientService;
	}


	public sendAnalysisStatus(analysisEvent: SonarWebhookEvent): Promise<void> {

		const githubCheck: ChecksCreateParams = {
			name: this.configurationService.get().context,
			owner: this.configurationService.get().context,
			repo: analysisEvent.properties.repository,
			conclusion: CommitStatusEnum.success ? "success" : "action_required",
			completed_at: analysisEvent.analysedAt.toISOString(),
			head_sha: analysisEvent.properties.commitId,
		};


		return new Promise<void>((resolve, reject) => {
			this.githubClientService.createCheckStatus(githubCheck)
				.then(() => {
					this.eventBus.emit(AppEvent.statusSent, githubCheck);
					LOGGER.info("check status update (%s) was sent to github", githubCheck.conclusion);
					resolve();
				})
				.catch((error: any) => {
					LOGGER.error("could not persist check status for %s with commit id %s", githubCheck.repo, githubCheck.head_sha);
					LOGGER.error(error);
					reject();
				});
			}
		);
	}
}

export default CommitStatusSender;