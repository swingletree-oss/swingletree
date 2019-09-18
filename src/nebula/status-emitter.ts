import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import { NebulaConfig } from "./config";
import EventBus from "../core/event/event-bus";
import { NotificationEvent } from "../core/event/event-model";
import { Swingletree } from "../core/model";
import { TemplateEngine, Templates } from "../core/template/template-engine";
import { NebulaEvents } from "./events";
import { NebulaModel } from "./model";


@injectable()
export class NebulaStatusEmitter {
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
		this.context = configurationService.get(NebulaConfig.CONTEXT);

		eventBus.register(NebulaEvents.EventType.REPORT_RECEIVED, this.reportReceivedHandler, this);
	}

	public getAnnotations(report: NebulaModel.Report): Swingletree.Annotation[] {
		const annotations: Swingletree.Annotation[] = [];

		// TODO: implement

		return annotations;
	}

	public reportReceivedHandler(event: NebulaEvents.ReportReceivedEvent) {
		const annotations = this.getAnnotations(event.report);

		const notificationData: Swingletree.AnalysisReport = {
			sender: this.context,
			source: event.source,
			checkStatus: event.report.payload.build.result.status == NebulaModel.ResultValue.SUCCESS ? Swingletree.Conclusion.PASSED : Swingletree.Conclusion.BLOCKED,
			title: `Gradle Build`,
			metadata: {
			},
			annotations: annotations
		};

		const notificationEvent = new NotificationEvent(notificationData);
		this.eventBus.emit(notificationEvent);
	}
}

export default NebulaStatusEmitter;