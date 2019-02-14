import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { ChecksCreateParams } from "@octokit/rest";
import { DATABASE_INDEX } from "../db/redis-client";
import { Health } from "../health-service";

/** Contains event identifiers.
 */
export enum Events {
	GithubCheckStatusUpdatedEvent = "github:checkrun:updated",
	GithubCheckRunWriteEvent = "github:checkrun:write",
	SonarAnalysisComplete = "sonar:analysis-complete",
	AppInstalledEvent = "github:app-installed",
	DatabaseReconnect = "database:reconnect",
	HealthCheckEvent = "swingletree:healthcheck",
	HealthStatusEvent = "swingletree:healthcheck:status",
	CacheSyncEvent = "swingletree:cachesync"
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

export class DatabaseReconnectEvent extends SwingletreeEvent {
	databaseIndex: DATABASE_INDEX;

	constructor(databaseIndex: DATABASE_INDEX) {
		super(Events.DatabaseReconnect);

		this.databaseIndex = databaseIndex;
	}
}

export class CacheSyncEvent extends SwingletreeEvent {
	constructor() {
		super(Events.CacheSyncEvent);
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
	targetBranch?: string;

	constructor(analysisEvent: SonarWebhookEvent) {
		super(Events.SonarAnalysisComplete);

		this.analysisEvent = analysisEvent;
	}
}

export class PerformHealthCheckEvent extends SwingletreeEvent {
	constructor() {
		super(Events.HealthCheckEvent);
	}
}

export class HealthStatusEvent extends SwingletreeEvent {
	health: Health;

	constructor(health: Health) {
		super(Events.HealthStatusEvent);

		this.health = health;
	}
}