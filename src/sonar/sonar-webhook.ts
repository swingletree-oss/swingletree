"use strict";

import { GitHubGhCommitStatusContainer, CommitStatusEnum, GitHubGhCommitStatus } from "../github/model/gh-commit-status";
import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../app-events";
import { QualityGateStatus } from "./model/sonar-quality-gate";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { EventEmitter } from "events";

const unirest = require("unirest");

export class SonarWebhook {
	public static readonly IGNORE_ID = "sonar";

	eventEmitter: EventEmitter;

	constructor(eventEmitter: EventEmitter) {
		this.eventEmitter = eventEmitter;
	}

	private isWebhookEventRelevant(event: SonarWebhookEvent) {
		if (event.properties !== undefined) {
			return event.properties.appAction === "respond" && //  TODO: find better name / use enum
				event.properties.branch !== undefined &&
				event.properties.commitId !== undefined &&
				event.properties.repository !== undefined;
		}
		return true; // TODO: check for analyze marker property in properties section // get target branch from there?
	}

	public webhook = (req: Request, res: Response) => {
		const event = new SonarWebhookEvent(req.body);

		if (this.isWebhookEventRelevant(event)) {
			const commitStatusContainer = new GitHubGhCommitStatusContainer(event.properties.repository, event.properties.commitId);
			let commitStatus: GitHubGhCommitStatus;

			if (event.qualityGate.status === QualityGateStatus.OK) {
				commitStatus = new GitHubGhCommitStatus(CommitStatusEnum.success);
				commitStatus.description = "Quality gate passed.";
			} else {
				commitStatus = new GitHubGhCommitStatus(CommitStatusEnum.failure);
				commitStatus.description = "Ouality gate failed.";
			}

			commitStatus.context = "GHPRQG"; // TODO: think of a cool name
			commitStatus.target_url = event.serverUrl;

			commitStatusContainer.payload = commitStatus;

			this.eventEmitter.emit(AppEvent.sendStatus, commitStatusContainer);
		} else {
			this.eventEmitter.emit(AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
		}

	}
}
