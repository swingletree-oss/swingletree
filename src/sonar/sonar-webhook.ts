"use strict";

import { GithubCommitStatusContainer, CommitStatusEnum, GithubCommitStatus } from "../github/model/gh-commit-status";
import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../app-events";
import { QualityGateStatus } from "./model/sonar-quality-gate";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { injectable } from "inversify";
import { inject } from "inversify";
import EventBus from "../event-bus";
import { ConfigurationService } from "../configuration";
import { LOGGER } from "../logger";


/** Provides a Webhook for Sonar
 */
@injectable()
class SonarWebhook {
	public static readonly IGNORE_ID = "sonar";

	private eventBus: EventBus;
	private configurationService: ConfigurationService;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
	}

	private isWebhookEventRelevant(event: SonarWebhookEvent) {
		if (event.properties !== undefined) {
			return event.properties.branch !== undefined &&
				event.properties.commitId !== undefined &&
				event.properties.repository !== undefined;
		}
		return true; // TODO: check for analyze marker property in properties section // get target branch from there?
	}

	public webhook = (req: Request, res: Response) => {
		LOGGER.info("received SonarQube webhook event");

		const event = new SonarWebhookEvent(req.body);

		if (this.isWebhookEventRelevant(event)) {
			const commitStatusContainer = new GithubCommitStatusContainer(event.properties.repository, event.properties.commitId);
			let commitStatus: GithubCommitStatus;

			if (event.qualityGate.status === QualityGateStatus.OK) {
				commitStatus = new GithubCommitStatus(CommitStatusEnum.success);
				commitStatus.description = "Quality gate passed.";
			} else {
				commitStatus = new GithubCommitStatus(CommitStatusEnum.failure);
				commitStatus.description = "Quality gate failed.";
			}

			commitStatus.context = this.configurationService.get().context;
			commitStatus.target_url = event.serverUrl;

			commitStatusContainer.payload = commitStatus;

			this.eventBus.emit(AppEvent.sendStatus, commitStatusContainer);
		} else {
			this.eventBus.emit(AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
		}

		res.sendStatus(204);
	}
}

export default SonarWebhook;