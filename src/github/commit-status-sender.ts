"use strict";

import { AppEvent } from "../models/app-events";
import { GitHubGhCommitStatus, GitHubGhCommitStatusContainer } from "./model/gh-commit-status";
import { EventEmitter } from "events";

const unirest = require("unirest");

export class CommitStatusSender {
	eventEmitter: EventEmitter;
	apiEndpoint: string;

	constructor(eventEmitter: EventEmitter, apiEndpoint: string) {
		this.eventEmitter = eventEmitter;
		this.apiEndpoint = apiEndpoint;
		this.eventEmitter.on(AppEvent.sendStatus, this.sendStatus);
	}

	public sendStatus = (status: GitHubGhCommitStatusContainer) => {
		unirest.post(this.apiEndpoint + "/repos/" + status.repository + "/statuses/" + status.commitId)
			.headers({ "Accept": "application/json", "Content-Type": "application/json" })
			.send(status.payload)
			.end(function(response: any) {
				this.eventEmitter.emit(AppEvent.statusSent, status, this.apiEndpoint);
			}
		);
	}
}
