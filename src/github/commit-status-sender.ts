"use strict";

import { LOGGER } from "../logger";
import { GithubWebhookEventType, GithubWebhookEvent, GithubPushWebhookEvent } from "./model/gh-webhook-event";
import { AppEvent } from "../app-events";
import { GithubCommitStatus, GithubCommitStatusContainer, CommitStatusEnum } from "./model/gh-commit-status";
import GithubClientService from "./client/github-client";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { injectable, inject } from "inversify";
import { ConfigurationService } from "../configuration";
import EventBus from "../event-bus";


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

		if (configurationService.get().github.pendingCommitStatus) {
			this.eventBus.register(AppEvent.githubPushEvent, this.sendPendingStatus, this);
		}

		this.githubClientService = githubClientService;
	}

	public sendPendingStatus(githubEvent: GithubWebhookEvent): Promise<void> {
		if (githubEvent.eventType == GithubWebhookEventType.PUSH) {
			const event = githubEvent as GithubPushWebhookEvent;
			const commitStatusContainer = new GithubCommitStatusContainer(event.sourceLocation.repo, event.sourceLocation.ref);

			const commitStatus = new GithubCommitStatus(CommitStatusEnum.pending);
			commitStatus.context = this.configurationService.get().context;

			commitStatusContainer.payload = commitStatus;

			return new Promise<void>((resolve, reject) => {
				this.githubClientService.createCommitStatus(commitStatusContainer)
					.then(() => {
						this.eventBus.emit(AppEvent.statusSent, commitStatusContainer);
						LOGGER.info("commit status update was sent to github");
						resolve();
					})
					.catch((error: any) => {
						LOGGER.error("could not persist status for %s with commit id %s", commitStatusContainer.repository, commitStatusContainer.commitId);
						LOGGER.error(error);
						reject();
					});
				}
			);
		}
	}

	public sendAnalysisStatus(analysisEvent: SonarWebhookEvent): Promise<void> {

		const commitStatusContainer = new GithubCommitStatusContainer(analysisEvent.properties.repository, analysisEvent.properties.commitId);
		let commitStatus: GithubCommitStatus;

		if (analysisEvent.statusSuccess) {
			commitStatus = new GithubCommitStatus(CommitStatusEnum.success);
			commitStatus.description = "Quality gate passed.";
		} else {
			commitStatus = new GithubCommitStatus(CommitStatusEnum.failure);
			commitStatus.description = "Quality gate failed with " + analysisEvent.qualityGate.getFailureCount() + " violations.";
		}

		commitStatus.context = this.configurationService.get().context;
		commitStatus.target_url = analysisEvent.dashboardUrl;

		commitStatusContainer.payload = commitStatus;


		return new Promise<void>((resolve, reject) => {
			this.githubClientService.createCommitStatus(commitStatusContainer)
				.then(() => {
					this.eventBus.emit(AppEvent.statusSent, commitStatusContainer);
					LOGGER.info("commit status update (%s) was sent to github", commitStatus.state);
					resolve();
				})
				.catch((error: any) => {
					LOGGER.error("could not persist status for %s with commit id %s", commitStatusContainer.repository, commitStatusContainer.commitId);
					LOGGER.error(error);
					reject();
				});
			}
		);
	}
}

export default CommitStatusSender;