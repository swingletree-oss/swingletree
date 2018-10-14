import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { ChecksCreateParams } from "@octokit/rest";

export enum Events {
	GithubCheckStatusUpdatedEvent = "github:checkrun:updated",
	webhookEventIgnored = "github:webhook-event-ignored",
	SonarAnalysisComplete = "sonar:analysis-complete",
	AppInstalledEvent = "github:app-installed"
}


export abstract class SwingletreeEvent {
	eventType: Events;

	constructor(eventType: Events) {
		this.eventType = eventType;
	}

	public getEventType(): Events {
		return this.eventType;
	}
}


export class AppInstalledEvent extends SwingletreeEvent {
	login: string;
	installationId: number;
	repositories?: string[];

	constructor(login: string, installationId: number) {
		super(Events.AppInstalledEvent);

		this.login = login;
		this.installationId = installationId;
	}
}

export class GithubCheckStatusUpdatedEvent extends SwingletreeEvent {
	checkRunData: ChecksCreateParams;

	constructor(checkRunData: ChecksCreateParams) {
		super(Events.GithubCheckStatusUpdatedEvent);

		this.checkRunData = checkRunData;
	}
}

export class SonarAnalysisCompleteEvent extends SwingletreeEvent {
	analysisEvent: SonarWebhookEvent;

	constructor(analysisEvent: SonarWebhookEvent) {
		super(Events.SonarAnalysisComplete);

		this.analysisEvent = analysisEvent;
	}
}