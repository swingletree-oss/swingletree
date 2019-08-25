import { injectable, inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { NotificationEventData, NotificationCheckStatus, NotificationEvent } from "../core/event/event-model";
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

		const notificationData: NotificationEventData = {
			sender: this.context,
			sha: event.commitId,
			org: event.owner,
			repo: event.repo,
			checkStatus: riskCounts.size == 0 ? NotificationCheckStatus.PASSED : NotificationCheckStatus.BLOCKED,
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