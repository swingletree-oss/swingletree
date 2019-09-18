import { RepositorySourceConfigurable } from "../core/event/event-model";
import { Swingletree } from "../core/model";
import { NebulaModel } from "./model";

export namespace NebulaEvents {
	export enum EventType {
		REPORT_RECEIVED = "nebula:report-received"
	}

	abstract class NebulaEvent extends RepositorySourceConfigurable {
		constructor(eventType: EventType, source: Swingletree.ScmSource) {
			super(eventType, source);
		}
	}

	export class ReportReceivedEvent extends NebulaEvent {
		report: NebulaModel.Report;

		constructor(report: any, source: Swingletree.ScmSource) {
			super(EventType.REPORT_RECEIVED, source);

			this.report = report;
		}
	}
}