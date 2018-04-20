"use strict";

import { LOGGER } from "../logger";

import { AppEvent } from "../app-events";
import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import { GithubTokenFactory } from "./token/github-tokens";
import { EventEmitter } from "events";

const Octokit = require("@octokit/rest");

/** Sends Commit Status Requests to GitHub
 */
export class CommitStatusSender {
	private eventEmitter: EventEmitter;
	private apiEndpoint: string;
	private ghClient: any;
	private tokenFactory: GithubTokenFactory;

	constructor(eventEmitter: EventEmitter, apiEndpoint: string, tokenFactory: GithubTokenFactory) {
		this.eventEmitter = eventEmitter;
		this.apiEndpoint = apiEndpoint;
		this.eventEmitter.on(AppEvent.sendStatus, this.sendStatus);
		this.ghClient = Octokit({
			baseUrl: apiEndpoint
		});

		this.tokenFactory = tokenFactory;
	}

	private sendStatus = (status: GitHubGhCommitStatusContainer) => {

		const coordinates = status.repository.split("/");

		this.ghClient.authenticate({
			type: "integration",
			token: this.tokenFactory.createJWT()
		});

		this.ghClient.repos.createStatus({
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
