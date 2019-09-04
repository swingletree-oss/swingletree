import { SwingletreeEvent, RepositorySourceConfigurable } from "../core/event/event-model";
import { TwistlockModel } from "./model";
import { Swingletree } from "../core/model";

export enum TwistlockEvents {
	TwistlockReportReceived = "twistlock:report-received"
}

abstract class TwistlockEvent extends RepositorySourceConfigurable {
	constructor(eventType: TwistlockEvents, source: Swingletree.ScmSource) {
		super(eventType, source);
	}
}

export class TwistlockReportReceivedEvent extends TwistlockEvent {
	report: TwistlockModel.Report;

	constructor(report: TwistlockModel.Report, source: Swingletree.ScmSource) {
		super(TwistlockEvents.TwistlockReportReceived, source);

		this.report = report;
	}
}