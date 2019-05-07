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
import { Zap } from "./zap-model";

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

	public getRiskCounts(report: Zap.Report): Map<Zap.Riskcode, number> {
		const counts = new Map<Zap.Riskcode, number>();

		report.site.forEach((site) => {
			site.alerts.forEach((alert) => {
				if (counts.has(alert.riskcode)) {
					counts.set(alert.riskcode, counts.get(alert.riskcode) + 1);
				} else {
					counts.set(alert.riskcode, 1);
				}
			});
		});

		return counts;
	}

	public async reportReceivedHandler(event: ZapReportReceivedEvent) {
		const riskCounts = this.getRiskCounts(event.report);

		const checkRun: ChecksCreateParams = {
			name: this.context,
			owner: event.owner,
			repo: event.repository,
			status: "completed",
			conclusion: riskCounts.size == 0 ? "success" : "action_required",
			started_at: new Date().toISOString(),
			completed_at: new Date().toISOString(),
			head_sha: event.commitId
		};

		const templateData: Zap.ReportTemplate = {
			event: event,
			counts: riskCounts
		};

		checkRun.output = {
			title: `OWASP Zap scan result`,
			summary: this.templateEngine.template<Zap.ReportTemplate>(
				Templates.ZAP_SCAN,
				templateData
			)
		};

		this.eventBus.emit(new GithubCheckRunWriteEvent(checkRun));
	}
}

export default ZapStatusEmitter;