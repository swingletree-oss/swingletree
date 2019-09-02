import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import EventBus from "../core/event/event-bus";
import { NotificationEvent } from "../core/event/event-model";
import { Swingletree } from "../core/model";
import { TemplateEngine, Templates } from "../core/template/template-engine";
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
		const counters = new Map<Zap.Riskcode, number>();

		report.site.forEach((site) => {
			site.alerts.forEach((alert) => {
				if (counters.has(alert.riskcode)) {
					counters.set(alert.riskcode, counters.get(alert.riskcode) + 1);
				} else {
					counters.set(alert.riskcode, 1);
				}
			});
		});

		return counters;
	}

	public reportReceivedHandler(event: ZapReportReceivedEvent) {
		const riskCounts = this.getRiskCounts(event.report);

		const templateData: Zap.ReportTemplate = {
			event: event,
			counts: riskCounts
		};

		let totalIssueCount = 0;
		riskCounts.forEach((count) => {
			totalIssueCount += count;
		});

		const notificationData: Swingletree.AnalysisReport = {
			sender: this.context,
			source: event.source,
			checkStatus: riskCounts.size == 0 ? Swingletree.Conclusion.PASSED : Swingletree.Conclusion.BLOCKED,
			title: `${totalIssueCount} issues found`,
			markdown: this.templateEngine.template<Zap.ReportTemplate>(
				Templates.ZAP_SCAN,
				templateData
			)
		};

		this.eventBus.emit(new NotificationEvent(notificationData));
	}
}

export default ZapStatusEmitter;