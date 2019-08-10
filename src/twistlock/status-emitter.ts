import { injectable, inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { GithubCheckRunWriteEvent } from "../core/event/event-model";
import { ChecksCreateParams } from "@octokit/rest";
import { ConfigurationService } from "../configuration";
import { LOGGER } from "../logger";
import { Templates } from "../core/template/template-engine";
import { TemplateEngine } from "../core/template/template-engine";
import { TwistlockEvents, TwistlockReportReceivedEvent } from "./events";
import { TwistlockConfig } from "./config";
import { TwistlockModel } from "./model";

@injectable()
class TwistlockStatusEmitter {
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
		this.context = configurationService.get(TwistlockConfig.CONTEXT);

		eventBus.register(TwistlockEvents.TwistlockReportReceived, this.reportReceivedHandler, this);
	}


	private getConclusion(event: TwistlockReportReceivedEvent): "action_required" | "success" {
		let conclusion: "success" | "action_required" = "success";
		if (event.report.results && event.report.results.length > 0) {
			event.report.results.forEach((result) => {
				if (result.complianceDistribution.total + result.vulnerabilityDistribution.total > 0) {
					conclusion = "action_required";
				}
			});
		}

		return conclusion;
	}

	public reportReceivedHandler(event: TwistlockReportReceivedEvent) {

		const config = new TwistlockModel.DefaultRepoConfig(event.getPluginConfig<TwistlockModel.RepoConfig>("twistlock"));
		const issueReport = new TwistlockModel.util.FindingReport(
			event.report,
			config.thresholdCvss,
			config.thresholdCompliance,
			config.whitelist
		);

		const checkRun: ChecksCreateParams = {
			name: this.context,
			owner: event.owner,
			repo: event.repo,
			status: "completed",
			conclusion: this.getConclusion(event),
			started_at: new Date().toISOString(),
			completed_at: new Date().toISOString(),
			head_sha: event.commitId
		};

		const templateData: TwistlockModel.Template = {
			report: event.report,
			issues: issueReport
		};

		checkRun.output = {
			title: `${issueReport.issuesCount()} issues found`,
			summary: this.templateEngine.template<TwistlockModel.Template>(
				Templates.TWISTLOCK_SCAN,
				templateData
			)
		};

		this.eventBus.emit(new GithubCheckRunWriteEvent(checkRun));
	}
}

export default TwistlockStatusEmitter;