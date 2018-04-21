"use strict";

import { LOGGER } from "../logger";

import { AppEvent } from "../app-events";
import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import GithubClientService from "./client/github-client";
import { EventEmitter } from "events";
import { injectable, inject } from "inversify";
import Identifiers from "../ioc/identifiers";
import ConfigurationService from "../configuration";
import EventBus from "../event-bus";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class CommitStatusSender {

	private configurationService: ConfigurationService;
	private githubClientService: GithubClientService;
	private eventBus: EventBus;

	constructor(
		@inject(Identifiers.EventBus) eventBus: EventBus,
		@inject(Identifiers.ConfigurationService) configurationService: ConfigurationService,
		@inject(Identifiers.GithubClientService) githubClientService: GithubClientService
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.eventBus.get().on(AppEvent.sendStatus, this.sendStatus);

		this.githubClientService = githubClientService;
	}

	public sendStatus = (status: GitHubGhCommitStatusContainer) => {

		const coordinates = status.repository.split("/");
		const ghClient = this.githubClientService.getClient();

		ghClient.repos.createStatus({
			owner: coordinates[0],
			repo: coordinates[1],
			sha: status.commitId,
			state: status.payload.state,
			target_url: status.payload.target_url,
			description: status.payload.description,
			context: this.configurationService.get().context
		})
		.then(() => {
			this.eventBus.get().emit(AppEvent.statusSent, status);
		})
		.catch((error: any) => {
			LOGGER.error("could not persist status for %s", status.repository);
			LOGGER.error(error);
		});
	}
}

export default CommitStatusSender;