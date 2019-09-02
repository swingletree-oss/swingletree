import { SwingletreeEvent, Events, RepositorySourceConfigurable } from "../core/event/event-model";
import { SonarWebhookEvent } from "./client/sonar-wehook-event";
import { Swingletree } from "../core/model";

export enum SonarEvents {
	SonarAnalysisComplete = "sonar:analysis-complete"
}

abstract class SonarEvent extends RepositorySourceConfigurable {
	constructor(eventType: SonarEvents, source: Swingletree.ScmSource) {
		super(eventType, source);
	}
}

export class SonarAnalysisCompleteEvent extends SonarEvent {
	analysisEvent: SonarWebhookEvent;
	targetBranch?: string;

	constructor(analysisEvent: SonarWebhookEvent, source: Swingletree.ScmSource) {
		super(SonarEvents.SonarAnalysisComplete, source);

		this.analysisEvent = analysisEvent;
	}
}