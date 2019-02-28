import { injectable, inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { GithubCheckRunWriteEvent } from "../core/event/event-model";
import { ChecksCreateParams, ChecksCreateParamsOutputAnnotations, ChecksCreateParamsOutput } from "@octokit/rest";
import { ConfigurationService } from "../configuration";
import { SonarWebhookEvent, QualityGateStatus } from "./client/sonar-wehook-event";
import SonarClient from "./client/sonar-client";
import { LOGGER } from "../logger";
import { Templates } from "../core/template/template-engine";
import { TemplateEngine } from "../core/template/template-engine";
import { Sonar } from "./client/sonar-issue";
import { SonarEvents, SonarAnalysisCompleteEvent } from "./events";
import { SonarCheckRunSummaryTemplate } from "./sonar-template";
import { SonarConfig } from "./sonar-config";

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
		this.context = configurationService.get(SonarConfig.CONTEXT);

		eventBus.register(SonarEvents.SonarAnalysisComplete, this.analysisCompleteHandler, this);
	}

	private dashboardUrl(sonarEvent: SonarWebhookEvent): string {
		if (sonarEvent.branch) {
			return sonarEvent.branch.url;
		} else {
			return (sonarEvent.project) ? sonarEvent.project.url : sonarEvent.serverUrl;
		}
	}

	private async processCoverageDeltas(output: ChecksCreateParamsOutput, summaryTemplateData: SonarCheckRunSummaryTemplate, event: SonarAnalysisCompleteEvent) {
		try {
			const projectKey = event.analysisEvent.project.key;
			const currentBranch = event.analysisEvent.branch.name;
			const targetBranch = event.targetBranch;

			let deltaCoverage: number = null;
			let branchCoverage: number = null;

			if (!targetBranch && event.analysisEvent.branch.isMain) { // main branch analysis and no target branch set in sonar analysis parameters
				const historyDelta = await this.sonarClient.getMeasureHistoryDelta(projectKey, Sonar.model.Metrics.COVERAGE, currentBranch);
				deltaCoverage = historyDelta.delta;
				branchCoverage = historyDelta.coverage;
			} else { // non-main branch analysis
				branchCoverage = await this.sonarClient.getMeasureValueAsNumber(projectKey, Sonar.model.Metrics.COVERAGE, currentBranch);
				const mainCoverage = await this.sonarClient.getMeasureValueAsNumber(projectKey, Sonar.model.Metrics.COVERAGE, targetBranch);
				deltaCoverage = branchCoverage - mainCoverage;

				summaryTemplateData.targetCoverage = mainCoverage;
			}

			summaryTemplateData.branchCoverage = branchCoverage;

			output.title = `${output.title} - Coverage: ${branchCoverage.toFixed(1)} (${(deltaCoverage < 0 ? "" : "+")}${deltaCoverage.toFixed(1)}%)`;
		} catch (err) {
			LOGGER.warn("failed to calculate coverage delta: ", err);
		}
	}

	private processIssues(checkRun: ChecksCreateParams, summaryTemplateData: SonarCheckRunSummaryTemplate, issues: Sonar.model.Issue[], counters: Map<string, number>) {
		issues.forEach((item) => {
			const path = item.component.replace(`${item.project}:`, "");
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

				// omit values to comply to api validation
				if (annotation.start_line != annotation.end_line) {
					annotation.start_column = item.textRange.startOffset;
					annotation.end_column = item.textRange.endOffset;
				}
			}

			checkRun.output.annotations.push(annotation);
		});

		summaryTemplateData.issueCounts = counters;

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

		const summaryTemplateData: SonarCheckRunSummaryTemplate = { event: event.analysisEvent };

		checkRun.output = {
			title: `${event.analysisEvent.qualityGate.status}`,
			summary: ""
		};

		// calculate coverage deltas
		await this.processCoverageDeltas(checkRun.output, summaryTemplateData, event);

		try {
			const issues = await this.sonarClient.getIssues(event.analysisEvent.project.key, event.analysisEvent.branch.name);
			const counters: Map<string, number> = new Map<string, number>();

			// preset known rule types
			for (const rule in Sonar.model.RuleType) {
				counters.set(rule, 0);
			}

			if (issues.length > 0) {
				checkRun.output.annotations = [];

				this.processIssues(checkRun, summaryTemplateData, issues, counters);

				if (checkRun.output.annotations.length >= 50) {
					// this is a GitHub api constraint. Annotations are limited to 50 items max.
					LOGGER.debug("%s issues were retrieved. Limiting reported results to 50.", checkRun.output.annotations.length);
					summaryTemplateData.annotationsCapped = true;
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
		checkRun.output.summary = this.templateEngine.template<SonarCheckRunSummaryTemplate>(Templates.CHECK_RUN_SUMMARY, summaryTemplateData);

		this.eventBus.emit(new GithubCheckRunWriteEvent(checkRun));
	}
}

export default SonarStatusEmitter;