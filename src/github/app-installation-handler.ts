"use strict";

import { LOGGER } from "../logger";

import { injectable, inject } from "inversify";
import EventBus from "../event/event-bus";
import InstallationStorage from "./client/installation-storage";
import { Events, AppInstalledEvent, DatabaseReconnectEvent } from "../event/event-model";
import GithubClientService from "./client/github-client";
import { AppsListInstallationsResponseItem } from "@octokit/rest";
import { DATABASE_INDEX } from "../db/redis-client";


/** Handles GitHub-App installation notices sent by GitHub
 */
@injectable()
class GhAppInstallationHandler {
	private clientService: GithubClientService;
	private installationStorage: InstallationStorage;
	private eventBus: EventBus;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(InstallationStorage) installationStorage: InstallationStorage,
		@inject(GithubClientService) clientService: GithubClientService
	) {
		this.installationStorage = installationStorage;
		this.eventBus = eventBus;
		this.clientService = clientService;

		this.eventBus.register(Events.AppInstalledEvent, this.appInstalled, this);
		this.eventBus.register(Events.DatabaseReconnect, this.syncAppInstallations, this);
	}

	public appInstalled(event: AppInstalledEvent) {
		this.installationStorage.store(event.login, event.installationId);
		LOGGER.info("new installation for login %s was registered", event.login);
	}

	public async syncAppInstallations(event: DatabaseReconnectEvent) {
		if (event.databaseIndex == DATABASE_INDEX.INSTALLATION_STORAGE) {

			LOGGER.info("warming installation cache...");

			if (await this.installationStorage.keyCount() > 0) {
				LOGGER.debug("database is not empty. Skipping cache warming.");
				return;
			}

			try {
				const installations: AppsListInstallationsResponseItem[] = await this.clientService.getInstallations();

				installations.forEach((installation: AppsListInstallationsResponseItem) => {
					this.installationStorage.store(installation.account.login, installation.id);
				});
			} catch (err) {
				try {
					LOGGER.warn("could not update installation cache: %s", JSON.parse(err.message).message);
				} catch (err) {
					LOGGER.warn("could not update installation cache: %s", err.message);
				}
			}
		}
	}
}

export default GhAppInstallationHandler;