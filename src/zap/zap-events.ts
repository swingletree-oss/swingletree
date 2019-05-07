import { SwingletreeEvent, Events } from "../core/event/event-model";
import { Zap } from "./zap-model";

export enum ZapEvents {
	ZapReportReceived = "zap:report-received"
}

abstract class ZapEvent extends SwingletreeEvent {
	constructor(eventType: ZapEvents) {
		super(eventType);
	}
}

export class ZapReportReceivedEvent extends ZapEvent {
	commitId: string;
	owner: string;
	repository: string;
	report: Zap.Report;

	constructor(report: Zap.Report) {
		super(ZapEvents.ZapReportReceived);

		this.report = report;
	}
}