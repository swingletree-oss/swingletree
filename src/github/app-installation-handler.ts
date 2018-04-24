"use strict";

import { LOGGER } from "../logger";

import { AppEvent } from "../app-events";
import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import GithubClientService from "./client/github-client";
import { injectable, inject } from "inversify";
import EventBus from "../event-bus";
import InstallationStorage from "./client/installation-storage";
import { GhInstallation } from "./model/gh-webhook-event";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class GhAppInstallationHandler {
	private installationStorage: InstallationStorage;
	private eventBus: EventBus;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.eventBus = eventBus;

		this.eventBus.register(AppEvent.appInstalled, this.appInstalled, this);

		this.installationStorage = installationStorage;
	}

	public appInstalled(installation: GhInstallation) {
		LOGGER.info("login %s was registered", installation.login);
		this.installationStorage.store(installation.login, installation.installationId);
	}
}

export default GhAppInstallationHandler;