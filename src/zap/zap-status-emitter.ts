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

	public getAnnotations(report: Zap.Report): Swingletree.Annotation[] {
		const annotations: Swingletree.Annotation[] = [];

		report.site.forEach((site) => {
			site.alerts.forEach((alert) => {
				const annotation = new Swingletree.ProjectAnnotation();
				annotation.title = alert.alert;
				annotation.severity = Zap.SeverityUtil.convert(alert.riskcode);
				annotation.metadata = {
					riskdesc: alert.riskdesc,
					riskcode: alert.riskcode,
					confidence: alert.confidence
				};

				annotations.push(annotation);
			});
		});

		return annotations;
	}

	public reportReceivedHandler(event: ZapReportReceivedEvent) {
		const annotations = this.getAnnotations(event.report);

		const templateData: Zap.ReportTemplate = {
			event: event
		};

		const notificationData: Swingletree.AnalysisReport = {
			sender: this.context,
			source: event.source,
			checkStatus: annotations.length == 0 ? Swingletree.Conclusion.PASSED : Swingletree.Conclusion.BLOCKED,
			title: `${annotations.length} issues found`,
			metadata: {
				zapVersion: event.report["@version"]
			},
			annotations: annotations
		};

		const notificationEvent = new NotificationEvent(notificationData);
		notificationEvent.markdown = this.templateEngine.template<Zap.ReportTemplate>(
			Templates.ZAP_SCAN,
			templateData
		);

		this.eventBus.emit(notificationEvent);
	}
}

export default ZapStatusEmitter;