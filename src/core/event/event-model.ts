import { ChecksCreateParams, AppsListInstallationsResponseItem } from "@octokit/rest";
import { DATABASE_INDEX } from "../db/redis-client";
import { Health } from "../health-service";
import { WebhookPayloadInstallationInstallation } from "@octokit/webhooks";

/** Contains event identifiers.
 */
export enum Events {
	GithubCheckStatusUpdatedEvent = "core:github:checkrun:updated",
	GithubCheckRunWriteEvent = "core:github:checkrun:write",
	AppInstalledEvent = "core:github:app-installed",
	AppDeinstalledEvent = "core:github:app-deinstalled",
	DatabaseReconnect = "core:database:reconnect",
	HealthCheckEvent = "core:healthcheck",
	HealthStatusEvent = "core:healthcheck:status",
	CacheSyncEvent = "core:cachesync",
	GitHubCheckSuiteRequestedEvent = "core:checksuite:requested"
}

export interface SwingletreeRepoConfig {

}

/** Event superclass
 */
export abstract class SwingletreeEvent {
	eventType: string;
	config: SwingletreeRepoConfig;

	constructor(eventType: string) {
		this.eventType = eventType;
	}

	public getEventType(): string {
		return this.eventType;
	}
}

abstract class CoreEvent extends SwingletreeEvent {
	constructor(eventType: Events) {
		super(eventType);
	}
}


export class CheckSuiteRequestedEvent extends CoreEvent {
	checkSuiteId: number;
	owner: string;
	repo: string;
	branch: string;
	commitSha: string;

	constructor(checkSuiteId: number, owner: string, repo: string, branch: string, commitSha: string) {
		super(Events.GitHubCheckSuiteRequestedEvent);

		this.checkSuiteId = checkSuiteId;
		this.owner = owner;
		this.repo = repo;
		this.branch = branch;
		this.commitSha = commitSha;
	}
}

/** App installed event.
 *
 * This event is fired when a GitHub organization installed Swingletree.
 *
 */
export class AppInstalledEvent extends CoreEvent {
	account: string;
	accountId: number;

	installationId: number;
	installEvent: WebhookPayloadInstallationInstallation;

	constructor(installEvent: WebhookPayloadInstallationInstallation) {
		super(Events.AppInstalledEvent);

		this.account = installEvent.account.login;
		this.accountId = installEvent.account.id;

		this.installationId = installEvent.id;

		this.installEvent = installEvent;
	}
}

/** App deinstalled event.
 *
 * This event is fired when a GitHub organization UNinstalled Swingletree.
 */
export class AppDeinstalledEvent extends AppInstalledEvent {
	constructor(installEvent: WebhookPayloadInstallationInstallation) {
		super(installEvent);

		this.eventType = Events.AppDeinstalledEvent;
	}
}

/** Fired, when the Database client reconnects
 */
export class DatabaseReconnectEvent extends CoreEvent {
	databaseIndex: DATABASE_INDEX;

	constructor(databaseIndex: DATABASE_INDEX) {
		super(Events.DatabaseReconnect);

		this.databaseIndex = databaseIndex;
	}
}

/** Fired, when a cache refresh is scheduled or neccessary
 */
export class CacheSyncEvent extends CoreEvent {
	constructor() {
		super(Events.CacheSyncEvent);
	}
}

/** Fired, when a Check Run was written to GitHub
 */
export class GithubCheckRunWriteEvent extends CoreEvent {
	payload: ChecksCreateParams;

	constructor(payload: ChecksCreateParams) {
		super(Events.GithubCheckRunWriteEvent);

		this.payload = payload;
	}
}

export class GithubCheckStatusUpdatedEvent extends CoreEvent {
	checkRunData: ChecksCreateParams;

	constructor(checkRunData: ChecksCreateParams) {
		super(Events.GithubCheckStatusUpdatedEvent);

		this.checkRunData = checkRunData;
	}
}

export class PerformHealthCheckEvent extends CoreEvent {
	constructor() {
		super(Events.HealthCheckEvent);
	}
}

export class HealthStatusEvent extends CoreEvent {
	health: Health;

	constructor(health: Health) {
		super(Events.HealthStatusEvent);

		this.health = health;
	}
}