"use strict";

import { LOGGER } from "../logger";

import { AppEvent } from "../app-events";
import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import GithubClientService from "./client/github-client";
import { EventEmitter } from "events";
import { injectable, inject } from "inversify";
import Identifiers from "../ioc/identifiers";
import ConfigurationService from "../configuration";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class CommitStatusSender {
	private eventEmitter: EventEmitter;
	private apiEndpoint: string;
	private ghClient: any;

	private configurationService: ConfigurationService;
	private githubClientService: GithubClientService;

	constructor(
		eventEmitter: EventEmitter,
		@inject(Identifiers.ConfigurationService) configurationService: ConfigurationService,
		@inject(Identifiers.GithubClientService) githubClientService: GithubClientService
	) {
		this.eventEmitter = eventEmitter;
		this.configurationService = configurationService;
		this.eventEmitter.on(AppEvent.sendStatus, this.sendStatus);

		this.githubClientService = githubClientService;
	}

	private sendStatus = (status: GitHubGhCommitStatusContainer) => {

		const coordinates = status.repository.split("/");
		const ghClient = this.githubClientService.getClient();

		ghClient.repos.createStatus({
			owner: coordinates[0],
			repo: coordinates[1],
			sha: status.commitId,
			state: status.payload.state,
			target_url: status.payload.target_url,
			description: status.payload.description,
			context: "swingletree"
		})
		.then(() => {
			this.eventEmitter.emit(AppEvent.statusSent, status, this.apiEndpoint);
		})
		.catch((error: any) => {
			LOGGER.error("could not persist status for %s", status.repository);
			LOGGER.error(error);
		});
	}
}

export default CommitStatusSender;