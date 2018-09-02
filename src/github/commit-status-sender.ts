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
import { SonarClient } from "../sonar/client/sonar-client";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class CommitStatusSender {

	private configurationService: ConfigurationService;
	private githubClientService: GithubClientService;
	private eventBus: EventBus;
	private sonarClient: SonarClient;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(GithubClientService) githubClientService: GithubClientService,
		@inject(SonarClient) sonarClient: SonarClient
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.sonarClient = sonarClient;

		this.eventBus.register(AppEvent.sonarAnalysisComplete, this.sendAnalysisStatus, this);

		this.githubClientService = githubClientService;
	}


	public sendAnalysisStatus(analysisEvent: SonarWebhookEvent): Promise<void> {
		const coordinates = analysisEvent.properties.repository.split("/");

		const githubCheck: ChecksCreateParams = {
			name: this.configurationService.get().context,
			owner: coordinates[0],
			repo: coordinates[1],
			conclusion: analysisEvent.qualityGate.status == QualityGateStatus.OK ? "success" : "action_required",
			completed_at: new Date(analysisEvent.analysedAt).toISOString(),
			head_sha: analysisEvent.properties.commitId,
			details_url: analysisEvent.serverUrl
		};

		return new Promise<void>(async (resolve, reject) => {
			if (analysisEvent.qualityGate.status != QualityGateStatus.OK) {
				githubCheck.output = {
					title: analysisEvent.qualityGate.name,
					summary: analysisEvent.qualityGate.status
				};

				githubCheck.output.annotations = [];

				const severityMap: any = {
					"BLOCKER": "failure",
					"CRITICAL": "failure",
					"MAJOR": "failure",
					"MINOR": "warning",
					"INFO": "notice"
				};

				try {
					const issues = await this.sonarClient.getIssues(analysisEvent.project, analysisEvent.analysedAt);

					issues.forEach((item) => {
						const path = item.component.split(":").splice(0, 2).join(":");
						githubCheck.output.annotations.push({
							path: path,
							start_line: item.line || 0,
							end_line: item.line || 0,
							message: item.message,
							annotation_level: severityMap[item.severity],
							blob_href: item.component
						});
					});
					LOGGER.debug("annotating %s issues to check result", githubCheck.output.annotations.length);
				} catch (err) {
					LOGGER.warn("failed to retrieve SonarQube issues for check annotations. This affects %s @%s", analysisEvent.properties.repository, analysisEvent.properties.commitId);
				}
			}

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