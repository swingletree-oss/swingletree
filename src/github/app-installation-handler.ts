"use strict";

import { LOGGER } from "../logger";

import { injectable, inject } from "inversify";
import EventBus from "../event/event-bus";
import InstallationStorage from "./client/installation-storage";
import { Events, AppInstalledEvent } from "../event/event-model";


/** Handles GitHub-App installation notices sent by GitHub
 */
@injectable()
class GhAppInstallationHandler {
	private installationStorage: InstallationStorage;
	private eventBus: EventBus;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.installationStorage = installationStorage;
		this.eventBus = eventBus;

		this.eventBus.register(Events.AppInstalledEvent, this.appInstalled, this);
	}

	public appInstalled(event: AppInstalledEvent) {
		this.installationStorage.store(event.login, event.installationId);
		LOGGER.info("new installation for login %s was registered", event.login);
	}
}

export default GhAppInstallationHandler;