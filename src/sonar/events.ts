import { SwingletreeEvent, Events, RepositorySourceConfigurable } from "../core/event/event-model";
import { SonarWebhookEvent } from "./client/sonar-wehook-event";

export enum SonarEvents {
	SonarAnalysisComplete = "sonar:analysis-complete"
}

abstract class SonarEvent extends RepositorySourceConfigurable {
	constructor(eventType: SonarEvents, owner: string, repo: string) {
		super(eventType, owner, repo);
	}
}

export class SonarAnalysisCompleteEvent extends SonarEvent {
	commitId: string;
	analysisEvent: SonarWebhookEvent;
	targetBranch?: string;

	constructor(analysisEvent: SonarWebhookEvent, owner: string, repo: string) {
		super(SonarEvents.SonarAnalysisComplete, owner, repo);

		this.analysisEvent = analysisEvent;
	}
}