import { SwingletreeEvent, RepositorySourceConfigurable } from "../core/event/event-model";
import { Zap } from "./zap-model";

export enum ZapEvents {
	ZapReportReceived = "zap:report-received"
}

abstract class ZapEvent extends RepositorySourceConfigurable {
	constructor(eventType: ZapEvents, owner: string, repo: string) {
		super(eventType, owner, repo);
	}
}

export class ZapReportReceivedEvent extends ZapEvent {
	commitId: string;
	owner: string;
	repository: string;
	report: Zap.Report;

	constructor(report: Zap.Report, owner: string, repo: string) {
		super(ZapEvents.ZapReportReceived, owner, repo);

		this.report = report;
	}
}