"use strict";

import { LOGGER } from "../../logger";
import GithubClientService from "./client/github-client";
import { injectable, inject } from "inversify";
import EventBus from "../event/event-bus";
import { Events, GithubCheckStatusUpdatedEvent, GithubCheckRunWriteEvent } from "../event/event-model";


/** Sends Commit Status Requests to GitHub
 */
@injectable()
class CommitStatusSender {

	private githubClientService: GithubClientService;
	private eventBus: EventBus;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(GithubClientService) githubClientService: GithubClientService
	) {
		this.eventBus = eventBus;
		this.eventBus.register(Events.GithubCheckRunWriteEvent, this.sendAnalysisStatus, this);
		this.githubClientService = githubClientService;
	}

	public async sendAnalysisStatus(event: GithubCheckRunWriteEvent) {

		try {
			if (!(await this.githubClientService.isOrganizationKnown(event.payload.owner))) {
				LOGGER.debug("ignoring webhook event for unknown organization %s.", event.payload.owner);
				return;
			}
		} catch (err) {
			LOGGER.error("failed to look up organization %s in installation cache", event.payload.owner);
			return;
		}

		// send check run status to GitHub
		this.githubClientService
			.createCheckStatus(event.payload)
			.then(() => {
				LOGGER.info("check status update (%s) for %s/%s@%s was sent to github", event.payload.conclusion, event.payload.owner, event.payload.repo, event.payload.head_sha);
				this.eventBus.emit(
					new GithubCheckStatusUpdatedEvent(event.payload)
				);
			})
			.catch((error: any) => {
				LOGGER.error("could not persist check status for %s with commit id %s", event.payload.repo, event.payload.head_sha);
				LOGGER.error(error);
			});
	}
}

export default CommitStatusSender;