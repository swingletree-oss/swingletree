"use strict";

import { LOGGER } from "../logger";
import { AppEvent } from "../app-events";
import GithubClientService from "./client/github-client";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { injectable, inject } from "inversify";
import { ConfigurationService } from "../configuration";
import EventBus from "../event-bus";
import { ChecksCreateParams, ChecksCreateParamsOutputAnnotations } from "@octokit/rest";
import { QualityGateStatus } from "../sonar/model/sonar-quality-gate";
import { SonarClient } from "../sonar/client/sonar-client";
import { TemplateEngine, Templates } from "../template/template-engine";
import { SummaryTemplate } from "../template/model/summary-template";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class CommitStatusSender {

	private configurationService: ConfigurationService;
	private githubClientService: GithubClientService;
	private eventBus: EventBus;
	private sonarClient: SonarClient;
	private templateEngine: TemplateEngine;

	private readonly severityMap: any = {
		"BLOCKER": "failure",
		"CRITICAL": "failure",
		"MAJOR": "failure",
		"MINOR": "warning",
		"INFO": "notice"
	};

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(GithubClientService) githubClientService: GithubClientService,
		@inject(SonarClient) sonarClient: SonarClient,
		@inject(TemplateEngine) templateEngine: TemplateEngine
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.sonarClient = sonarClient;
		this.templateEngine = templateEngine;

		this.eventBus.register(AppEvent.sonarAnalysisComplete, this.sendAnalysisStatus, this);

		this.githubClientService = githubClientService;
	}


	public async sendAnalysisStatus(analysisEvent: SonarWebhookEvent): Promise<void> {
		const coordinates = analysisEvent.properties.repository.split("/");

		try {
			if (!(await this.githubClientService.isOrganizationKnown(coordinates[0]))) {
				LOGGER.debug("ignoring webhook event for unknown organization %s.", coordinates[0]);
				return Promise.resolve();
			}
		} catch (err) {
			LOGGER.error("failed to look up organization %s in installation cache", coordinates[0]);
			return Promise.reject(err);
		}

		const githubCheck: ChecksCreateParams = {
			name: this.configurationService.get().context,
			owner: coordinates[0],
			repo: coordinates[1],
			status: "completed",
			conclusion: analysisEvent.qualityGate.status == QualityGateStatus.OK ? "success" : "action_required",
			started_at: new Date(analysisEvent.analysedAt).toISOString(),
			completed_at: new Date(analysisEvent.analysedAt).toISOString(),
			head_sha: analysisEvent.properties.commitId,
			details_url: analysisEvent.dashboardUrl
		};

		return new Promise<void>(async (resolve, reject) => {
			const summaryTemplateData: SummaryTemplate = { event: analysisEvent };

			githubCheck.output = {
				title: `Sonar Quality Gate "${analysisEvent.qualityGate.name}"`,
				summary: ""
			};

			// acquire more information in case of a failed quality gate
			if (analysisEvent.qualityGate.status != QualityGateStatus.OK) {
				try {
					const issues = await this.sonarClient.getIssues(analysisEvent.project.key, analysisEvent.branch.name);

					if (issues.length > 0) {
						githubCheck.output.annotations = [];
						issues.forEach((item) => {
							const path = item.component.split(":").splice(2).join(":");
							const annotation: ChecksCreateParamsOutputAnnotations = {
								path: path,
								start_line: item.line || 1,
								end_line: item.line || 1,
								title: `${item.severity} ${item.type} (${item.rule})`,
								message: item.message,
								annotation_level: this.severityMap[item.severity] || "notice",
							};

							// set text range, if available
							if (item.textRange) {
								annotation.start_line = item.textRange.startLine;
								annotation.end_line = item.textRange.endLine;
								annotation.start_column = item.textRange.startOffset;
								annotation.end_column = item.textRange.endOffset;
							}

							githubCheck.output.annotations.push(annotation);
						});

						if (githubCheck.output.annotations.length >= 50) {
							// this is a GitHub api constraint. Annotations are limited to 50 items max.
							LOGGER.debug("%s issues were retrieved. Limiting reported results to 50.", githubCheck.output.annotations.length);
							summaryTemplateData.annotationsCapped = true;
							summaryTemplateData.originalIssueCount = githubCheck.output.annotations.length;

							// capping to 50 items
							githubCheck.output.annotations = githubCheck.output.annotations.slice(0, 50);
						} else {
							LOGGER.debug("annotating %s issues to check result", githubCheck.output.annotations.length);
						}
					}

				} catch (err) {
					LOGGER.warn("failed to retrieve SonarQube issues for check annotations. This affects %s @%s", analysisEvent.properties.repository, analysisEvent.properties.commitId);
				}
			}

			// add summary via template engine
			githubCheck.output.summary = this.templateEngine.template<SummaryTemplate>(Templates.CHECK_RUN_SUMMARY, summaryTemplateData);

			this.githubClientService.createCheckStatus(githubCheck)
				.then(() => {
					this.eventBus.emit(AppEvent.statusSent, githubCheck);
					LOGGER.info("check status update (%s) for %s/%s@%s was sent to github", githubCheck.conclusion, githubCheck.owner, githubCheck.repo, githubCheck.head_sha);
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