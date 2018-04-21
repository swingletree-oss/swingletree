"use strict";

import { GitHubGhCommitStatusContainer, CommitStatusEnum, GitHubGhCommitStatus } from "../github/model/gh-commit-status";
import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../app-events";
import { QualityGateStatus } from "./model/sonar-quality-gate";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { injectable } from "inversify/dts/annotation/injectable";
import Identifiers from "../ioc/identifiers";
import { inject } from "inversify/dts/annotation/inject";
import EventBus from "../event-bus";
import ConfigurationService from "../configuration";

const unirest = require("unirest");

/** Provides a Webhook for Sonar
 */
@injectable()
class SonarWebhook {
	public static readonly IGNORE_ID = "sonar";

	private eventBus: EventBus;
	private configurationService: ConfigurationService;

	constructor(
		@inject(Identifiers.EventBus) eventBus: EventBus,
		@inject(Identifiers.ConfigurationService) configurationService: ConfigurationService
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
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
				commitStatus.description = "Quality gate failed.";
			}

			commitStatus.context = this.configurationService.get().context;
			commitStatus.target_url = event.serverUrl;

			commitStatusContainer.payload = commitStatus;

			this.eventBus.get().emit(AppEvent.sendStatus, commitStatusContainer);
		} else {
			this.eventBus.get().emit(AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
		}

	}
}

export default SonarWebhook;