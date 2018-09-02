"use strict";

import { LOGGER } from "../logger";

import { AppEvent } from "../app-events";
import { GithubCommitStatus } from "./model/gh-commit-status";
import GithubClientService from "./client/github-client";
import { injectable, inject } from "inversify";
import EventBus from "../event-bus";
import InstallationStorage from "./client/installation-storage";
import { GithubInstallation, GithubInstallationWebhook } from "./model/gh-webhook-event";
import { GetInstallationsResponseItem } from "@octokit/rest";


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

		this.eventBus.register(AppEvent.appInstalled, this.appInstalled, this);
	}

	public appInstalled(installation: GetInstallationsResponseItem | any) {
		LOGGER.info("new installation for login %s was registered", installation.account.login);
		this.installationStorage.store(installation.account.login, installation.id);
	}
}

export default GhAppInstallationHandler;