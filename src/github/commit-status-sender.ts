"use strict";

import { LOGGER } from "../logger";
import { AppEvent } from "../app-events";
import GithubClientService from "./client/github-client";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { injectable, inject } from "inversify";
import { ConfigurationService } from "../configuration";
import EventBus from "../event-bus";
import { ChecksCreateParams } from "@octokit/rest";
import { QualityGateStatus } from "../sonar/model/sonar-quality-gate";


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
			conclusion: analysisEvent.qualityGate.status == QualityGateStatus.OK ? "success" : "action_required",
			completed_at: new Date(analysisEvent.analysedAt).toISOString(),
			head_sha: analysisEvent.properties.commitId,
		};

		// TODO: add and populate output property for Sonar issues
		if (analysisEvent.qualityGate.status != QualityGateStatus.OK) {
			githubCheck.output = {
				title: analysisEvent.qualityGate.name,
				summary: analysisEvent.qualityGate.status
			};
		}

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