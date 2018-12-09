import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { ChecksCreateParams } from "@octokit/rest";

/** Contains event identifiers.
 */
export enum Events {
	GithubCheckStatusUpdatedEvent = "github:checkrun:updated",
	GithubCheckRunWriteEvent = "github:checkrun:write",
	SonarAnalysisComplete = "sonar:analysis-complete",
	AppInstalledEvent = "github:app-installed"
}

/** Event superclass
 */
export abstract class SwingletreeEvent {
	eventType: Events;

	constructor(eventType: Events) {
		this.eventType = eventType;
	}

	public getEventType(): Events {
		return this.eventType;
	}
}

/** App installed event.
 *
 * This event is fired when a GitHub organization installed Swingletree.
 *
 */
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

export class GithubCheckRunWriteEvent extends SwingletreeEvent {
	payload: ChecksCreateParams;

	constructor(payload: ChecksCreateParams) {
		super(Events.GithubCheckRunWriteEvent);

		this.payload = payload;
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
	commitId: string;
	owner: string;
	repository: string;
	analysisEvent: SonarWebhookEvent;

	constructor(analysisEvent: SonarWebhookEvent) {
		super(Events.SonarAnalysisComplete);

		this.analysisEvent = analysisEvent;
	}
}