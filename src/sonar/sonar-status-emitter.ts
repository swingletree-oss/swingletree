import { injectable, inject } from "inversify";
import EventBus from "../event/event-bus";
import { Events, SonarAnalysisCompleteEvent, GithubCheckRunWriteEvent } from "../event/event-model";
import { ChecksCreateParams, ChecksCreateParamsOutputAnnotations } from "@octokit/rest";
import { ConfigurationService } from "../config/configuration";
import { SonarWebhookEvent, QualityGateStatus } from "./model/sonar-wehook-event";
import { SummaryTemplate } from "../template/model/summary-template";
import { SonarClient } from "./client/sonar-client";
import { LOGGER } from "../logger";
import { Templates } from "../template/template-engine";
import { TemplateEngine } from "../template/template-engine";

@injectable()
class SonarStatusEmitter {
	private readonly eventBus: EventBus;
	private readonly sonarClient: SonarClient;
	private readonly templateEngine: TemplateEngine;

	private readonly severityMap: any = {
		"BLOCKER": "failure",
		"CRITICAL": "failure",
		"MAJOR": "failure",
		"MINOR": "warning",
		"INFO": "notice"
	};

	private readonly context: string;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(SonarClient) sonarClient: SonarClient,
		@inject(TemplateEngine) templateEngine: TemplateEngine
	) {
		this.eventBus = eventBus;
		this.sonarClient = sonarClient;
		this.templateEngine = templateEngine;
		this.context = `${configurationService.get().context}/${configurationService.get().sonar.context}`;

		eventBus.register(Events.SonarAnalysisComplete, this.analysisCompleteHandler, this);
	}

	private dashboardUrl(sonarEvent: SonarWebhookEvent): string {
		if (sonarEvent.branch) {
			return sonarEvent.branch.url;
		} else {
			return (sonarEvent.project) ? sonarEvent.project.url : sonarEvent.serverUrl;
		}
	}

	public async analysisCompleteHandler(event: SonarAnalysisCompleteEvent) {

		const checkRun: ChecksCreateParams = {
			name: this.context,
			owner: event.owner,
			repo: event.repository,
			status: "completed",
			conclusion: event.analysisEvent.qualityGate.status == QualityGateStatus.OK ? "success" : "action_required",
			started_at: new Date(event.analysisEvent.analysedAt).toISOString(),
			completed_at: new Date(event.analysisEvent.analysedAt).toISOString(),
			head_sha: event.commitId,
			details_url: this.dashboardUrl(event.analysisEvent)
		};

		const summaryTemplateData: SummaryTemplate = { event: event.analysisEvent };

		checkRun.output = {
			title: `Sonar Quality Gate ${event.analysisEvent.qualityGate.status}`,
			summary: ""
		};

		try {
			const issues = await this.sonarClient.getIssues(event.analysisEvent.project.key, event.analysisEvent.branch.name);
			const counters: Map<string, number> = new Map<string, number>();

			if (issues.length > 0) {
				checkRun.output.annotations = [];

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

					// update counters
					if (counters.has(item.type)) {
						counters.set(item.type, counters.get(item.type) + 1);
					} else {
						counters.set(item.type, 1);
					}

					// set text range, if available
					if (item.textRange) {
						annotation.start_line = item.textRange.startLine;
						annotation.end_line = item.textRange.endLine;
						annotation.start_column = item.textRange.startOffset;
						annotation.end_column = item.textRange.endOffset;
					}

					checkRun.output.annotations.push(annotation);
				});

				if (checkRun.output.annotations.length >= 50) {
					// this is a GitHub api constraint. Annotations are limited to 50 items max.
					LOGGER.debug("%s issues were retrieved. Limiting reported results to 50.", checkRun.output.annotations.length);
					summaryTemplateData.annotationsCapped = true;
					summaryTemplateData.issueCounts = counters;
					summaryTemplateData.totalIssues = issues.length;

					// capping to 50 items
					checkRun.output.annotations = checkRun.output.annotations.slice(0, 50);
				} else {
					LOGGER.debug("annotating %s issues to check result", checkRun.output.annotations.length);
				}
			}
		} catch (err) {
			LOGGER.warn("failed to retrieve SonarQube issues for check annotations. This affects %s @%s", event.repository, event.commitId, err);
		}

		// add summary via template engine
		checkRun.output.summary = this.templateEngine.template<SummaryTemplate>(Templates.CHECK_RUN_SUMMARY, summaryTemplateData);

		this.eventBus.emit(new GithubCheckRunWriteEvent(checkRun));
	}
}

export default SonarStatusEmitter;