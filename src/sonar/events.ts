import { SwingletreeEvent, Events } from "../core/event/event-model";
import { SonarWebhookEvent } from "./client/sonar-wehook-event";

export enum SonarEvents {
	SonarAnalysisComplete = "sonar:analysis-complete"
}

abstract class SonarEvent extends SwingletreeEvent {
	constructor(eventType: SonarEvents) {
		super(eventType);
	}
}

export class SonarAnalysisCompleteEvent extends SonarEvent {
	commitId: string;
	owner: string;
	repository: string;
	analysisEvent: SonarWebhookEvent;
	targetBranch?: string;

	constructor(analysisEvent: SonarWebhookEvent) {
		super(SonarEvents.SonarAnalysisComplete);

		this.analysisEvent = analysisEvent;
	}
}