import { injectable, inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { NotificationEvent } from "../core/event/event-model";
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
import { Swingletree } from "../core/model";

@injectable()
class SonarStatusEmitter {
	private readonly eventBus: EventBus;
	private readonly sonarClient: SonarClient;
	private readonly templateEngine: TemplateEngine;

	private readonly severityMap: any = {
		"BLOCKER": Swingletree.Severity.BLOCKER,
		"CRITICAL": Swingletree.Severity.BLOCKER,
		"MAJOR": Swingletree.Severity.MAJOR,
		"MINOR": Swingletree.Severity.WARNING,
		"INFO": Swingletree.Severity.INFO
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

	private async processCoverageDeltas(summaryTemplateData: SonarCheckRunSummaryTemplate, event: SonarAnalysisCompleteEvent) {
		try {
			const projectKey = event.analysisEvent.project.key;
			const currentBranch = event.analysisEvent.branch.name;
			const targetBranch = event.targetBranch;

			let deltaCoverage: number = null;
			let branchCoverage: number = null;

			if (!targetBranch && event.analysisEvent.branch.isMain) { // main branch analysis and no target branch set in sonar analysis parameters
				const historyDelta = await this.sonarClient.getMeasureHistoryDelta(projectKey, Sonar.model.Metrics.COVERAGE);
				deltaCoverage = historyDelta.delta;
				branchCoverage = historyDelta.coverage;
			} else { // non-main branch analysis
				branchCoverage = await this.sonarClient.getMeasureValueAsNumber(projectKey, Sonar.model.Metrics.COVERAGE, currentBranch);
				const mainCoverage = await this.sonarClient.getMeasureValueAsNumber(projectKey, Sonar.model.Metrics.COVERAGE, targetBranch);
				deltaCoverage = branchCoverage - mainCoverage;

				summaryTemplateData.targetCoverage = mainCoverage;
			}

			summaryTemplateData.branchCoverage = branchCoverage;

			return `Coverage: ${branchCoverage.toFixed(1)} (${(deltaCoverage < 0 ? "" : "+")}${deltaCoverage.toFixed(1)}%)`;
		} catch (err) {
			LOGGER.warn("failed to calculate coverage delta: ", err);
		}
	}

	private getIssueProjectPath(issue: Sonar.model.Issue, issueSummary: Sonar.util.IssueSummary): string {
		let result = "";

		if (issue.subProject) {
			const subProject = issueSummary.components.get(issue.subProject);
			if (subProject && subProject.path) {
				result = `${subProject.path}/`;
			} else {
				LOGGER.debug("failed to retrieve sonar component path for subproject %s", issue.subProject);
				return undefined;
			}
		}

		const component = issueSummary.components.get(issue.component);
		if (component && component.path) {
			result = `${result}${component.path}`;
		} else {
			LOGGER.debug("failed to retrieve sonar component path for %s", issue.component);
			return undefined;
		}

		return result;
	}

	private processIssues(annotations: Swingletree.Annotation[], summaryTemplateData: SonarCheckRunSummaryTemplate, issueSummary: Sonar.util.IssueSummary, counters: Map<string, number>) {
		issueSummary.issues.forEach((item) => {

			const annotation: Swingletree.FileAnnotation = new Swingletree.FileAnnotation();
			Object.assign(annotation, {
				path: this.getIssueProjectPath(item, issueSummary),
				start: item.line,
				end: item.line,
				title: `${item.severity} ${item.type} (${item.rule})`,
				detail: item.message,
				severity: this.severityMap[item.severity] || Swingletree.Severity.INFO
			} as Swingletree.FileAnnotation);

			// update counters
			if (counters.has(item.type)) {
				counters.set(item.type, counters.get(item.type) + 1);
			} else {
				counters.set(item.type, 1);
			}

			// set text range, if available
			if (item.textRange) {
				annotation.start = item.textRange.startLine;
				annotation.end = item.textRange.endLine;

				// omit values to comply to api validation
				if (annotation.start != annotation.end) {
					annotation.start = item.textRange.startOffset;
					annotation.end = item.textRange.endOffset;
				}
			}

			if (annotation.path) {
				annotations.push(annotation);
			} else {
				LOGGER.debug("skipped an annotation due to missing path.");
			}
		});

		summaryTemplateData.issueCounts = counters;

	}

	public async analysisCompleteHandler(event: SonarAnalysisCompleteEvent) {
		const summaryTemplateData: SonarCheckRunSummaryTemplate = { event: event.analysisEvent };

		(event.source as Swingletree.GithubSource).branch = event.analysisEvent.branch ? [ event.analysisEvent.branch.name ] : null ;

		const notificationData: Swingletree.AnalysisReport = {
			sender: this.context,
			link: this.dashboardUrl(event.analysisEvent),
			source: event.source,
			checkStatus: event.analysisEvent.qualityGate.status == QualityGateStatus.OK ? Swingletree.Conclusion.PASSED : Swingletree.Conclusion.BLOCKED,
			title: `${event.analysisEvent.qualityGate.status}`
		};


		// calculate coverage deltas
		const titleCoverage = await this.processCoverageDeltas(summaryTemplateData, event);
		notificationData.title += ` - ${titleCoverage}`;

		try {
			const issueSummary = await this.sonarClient.getIssues(event.analysisEvent.project.key, event.analysisEvent.branch.name);
			const counters: Map<string, number> = new Map<string, number>();

			// preset known rule types
			for (const rule in Sonar.model.RuleType) {
				counters.set(rule, 0);
			}

			if (issueSummary.issues.length > 0) {
				notificationData.annotations = [];

				this.processIssues(notificationData.annotations, summaryTemplateData, issueSummary, counters);

				if (notificationData.annotations.length >= 50) {
					// this is a GitHub api constraint. Annotations are limited to 50 items max.
					summaryTemplateData.annotationsCapped = true;
					summaryTemplateData.totalIssues = issueSummary.issues.length;
				}
			}
		} catch (err) {
			LOGGER.warn("failed to retrieve SonarQube issues for check annotations. This affects %s : %s", event.source.toRefString(), err);
		}

		// add summary via template engine
		notificationData.markdown = this.templateEngine.template<SonarCheckRunSummaryTemplate>(Templates.CHECK_RUN_SUMMARY, summaryTemplateData);

		this.eventBus.emit(new NotificationEvent(notificationData));
	}
}

export default SonarStatusEmitter;