import { ChecksCreateParams } from "@octokit/rest";
import { DATABASE_INDEX } from "../db/redis-client";
import { Health } from "../health-service";
import { WebhookPayloadInstallationInstallation } from "@octokit/webhooks";
import { Swingletree } from "../model";

/** Contains event identifiers.
 */
export enum Events {
	GithubCheckStatusUpdatedEvent = "core:github:checkrun:updated",
	NotificationEvent = "core:notify",
	AppInstalledEvent = "core:github:app-installed",
	AppDeinstalledEvent = "core:github:app-deinstalled",
	DatabaseReconnect = "core:database:reconnect",
	HealthCheckEvent = "core:healthcheck",
	HealthStatusEvent = "core:healthcheck:status",
	CacheSyncEvent = "core:cachesync",
	GitHubCheckSuiteRequestedEvent = "core:checksuite:requested",
	EventAugmentionEvent = "core:cache:event:augment"
}

export interface RawRepositoryConfig {
	plugin: any;
}

export class RepositoryConfig implements RawRepositoryConfig {
	plugin: Map<string, RepositoryConfigPluginItem>;

	constructor(config?: RawRepositoryConfig) {
		if (config && config.plugin) {
			this.plugin = new Map<string, RepositoryConfigPluginItem>(Object.entries(config.plugin));
		} else {
			this.plugin = new Map<string, RepositoryConfigPluginItem>();
		}
	}
}

export interface RepositoryConfigPluginItem {
	enabled: boolean;
}

/** Event superclass
 */
export abstract class SwingletreeEvent {
	id: string;
	eventType: string;

	constructor(eventType: string) {
		this.eventType = eventType;
	}

	public getEventType(): string {
		return this.eventType;
	}
}

/** EventBus will apply Swingletree configuration file of the repository
 *  to all descendants of this event class.
 */
export abstract class RepositorySourceConfigurable extends SwingletreeEvent {
	source: Swingletree.ScmSource;
	config?: RepositoryConfig;

	/** Set to true, if event has been augmented by event cache service */
	augmented = false;

	constructor(eventType: Events | string, source: Swingletree.ScmSource) {
		super(eventType);

		this.source = source;
	}

	public isConfigurable(): boolean {
		return this.source.type == Swingletree.ScmType.GITHUB;
	}

	public getPluginConfig<T extends RepositoryConfigPluginItem>(plugin: string): T {
		if (this.config && this.config.plugin) {
			return this.config.plugin.get(plugin) as T;
		} else {
			return null;
		}
	}
}

abstract class CoreEvent extends SwingletreeEvent {
	constructor(eventType: Events) {
		super(eventType);
	}
}


export class CheckSuiteRequestedEvent extends RepositorySourceConfigurable {
	rerequested: boolean;
	checkSuiteId: number;

	constructor(checkSuiteId: number, source: Swingletree.GithubSource, rerequested = false) {
		super(Events.GitHubCheckSuiteRequestedEvent, source);

		this.checkSuiteId = checkSuiteId;
		this.source = source;
		this.rerequested = rerequested;
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
export class NotificationEvent extends RepositorySourceConfigurable {
	payload: Swingletree.AnalysisReport;

	constructor(payload: Swingletree.AnalysisReport) {
		super(Events.NotificationEvent, payload.source);

		this.payload = payload;
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