import { SwingletreeEvent } from "../core/event/event-model";
import { TwistlockModel } from "./model";

export enum TwistlockEvents {
	TwistlockReportReceived = "twistlock:report-received"
}

abstract class TwistlockEvent extends SwingletreeEvent {
	constructor(eventType: TwistlockEvents) {
		super(eventType);
	}
}

export class TwistlockReportReceivedEvent extends TwistlockEvent {
	commitId: string;
	owner: string;
	repository: string;
	report: TwistlockModel.Report;

	constructor(report: TwistlockModel.Report) {
		super(TwistlockEvents.TwistlockReportReceived);

		this.report = report;
	}
}