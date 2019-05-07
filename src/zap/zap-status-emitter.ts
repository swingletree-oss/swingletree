import { injectable, inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { GithubCheckRunWriteEvent } from "../core/event/event-model";
import { ChecksCreateParams } from "@octokit/rest";
import { ConfigurationService } from "../configuration";
import { LOGGER } from "../logger";
import { Templates } from "../core/template/template-engine";
import { TemplateEngine } from "../core/template/template-engine";
import { ZapConfig } from "./zap-config";
import { ZapEvents, ZapReportReceivedEvent } from "./zap-events";

@injectable()
class ZapStatusEmitter {
	private readonly eventBus: EventBus;
	private readonly templateEngine: TemplateEngine;
	private readonly context: string;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(TemplateEngine) templateEngine: TemplateEngine
	) {
		this.eventBus = eventBus;
		this.templateEngine = templateEngine;
		this.context = configurationService.get(ZapConfig.CONTEXT);

		eventBus.register(ZapEvents.ZapReportReceived, this.reportReceivedHandler, this);
	}

	public async reportReceivedHandler(event: ZapReportReceivedEvent) {

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

export default ZapStatusEmitter;