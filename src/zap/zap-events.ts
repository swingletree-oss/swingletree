import { RepositorySourceConfigurable } from "../core/event/event-model";
import { Swingletree } from "../core/model";
import { Zap } from "./zap-model";

export enum ZapEvents {
	ZapReportReceived = "zap:report-received"
}

abstract class ZapEvent extends RepositorySourceConfigurable {
	constructor(eventType: ZapEvents, source: Swingletree.ScmSource) {
		super(eventType, source);
	}
}

export class ZapReportReceivedEvent extends ZapEvent {
	commitId: string;
	report: Zap.Report;
	branch: string;

	constructor(report: Zap.Report, source: Swingletree.ScmSource) {
		super(ZapEvents.ZapReportReceived, source);

		this.report = report;
	}
}