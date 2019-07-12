import { SwingletreeEvent, RepositorySourceConfigurable } from "../core/event/event-model";
import { TwistlockModel } from "./model";

export enum TwistlockEvents {
	TwistlockReportReceived = "twistlock:report-received"
}

abstract class TwistlockEvent extends RepositorySourceConfigurable {
	constructor(eventType: TwistlockEvents, owner: string, repo: string) {
		super(eventType, owner, repo);
	}
}

export class TwistlockReportReceivedEvent extends TwistlockEvent {
	commitId: string;
	owner: string;
	repository: string;
	report: TwistlockModel.Report;

	constructor(report: TwistlockModel.Report, owner: string, repo: string) {
		super(TwistlockEvents.TwistlockReportReceived, owner, repo);

		this.report = report;
	}
}