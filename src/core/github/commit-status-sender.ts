"use strict";

import { LOGGER } from "../../logger";
import GithubClientService from "./client/github-client";
import { injectable, inject } from "inversify";
import EventBus from "../event/event-bus";
import { Events, NotificationEvent, NotificationCheckStatus } from "../event/event-model";
import { ChecksCreateParams, ChecksCreateParamsOutputAnnotations } from "@octokit/rest";


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
		this.eventBus.register(Events.NotificationEvent, this.sendAnalysisStatus, this);
		this.githubClientService = githubClientService;
	}

	public async sendAnalysisStatus(event: NotificationEvent) {

		try {
			if (!(await this.githubClientService.isOrganizationKnown(event.owner))) {
				LOGGER.debug("ignoring webhook event for unknown organization %s.", event.owner);
				return;
			}
		} catch (err) {
			LOGGER.error("failed to look up organization %s in installation cache", event.owner);
			return;
		}

		const checkCreateParams: ChecksCreateParams = {
			head_sha: event.payload.sha,
			owner: event.owner,
			repo: event.repo,
			details_url: event.payload.link,
			name: event.payload.sender,
			output: {
				title: event.payload.title,
				summary: event.payload.markdown || event.payload.shortMessage
			}
		};

		if (event.payload.checkStatus) {
			switch (event.payload.checkStatus) {
				case NotificationCheckStatus.PASSED: checkCreateParams.conclusion = "success"; break;
				case NotificationCheckStatus.BLOCKED: checkCreateParams.conclusion = "action_required"; break;
				case NotificationCheckStatus.UNDECISIVE: checkCreateParams.conclusion = "neutral"; break;
				case NotificationCheckStatus.ANALYSIS_FAILURE: checkCreateParams.conclusion = "failure"; break;
			}

			checkCreateParams.status = "completed";
		}

		if (event.payload.annotations) {
			if (event.payload.annotations.length >= 50) {
				// this is a GitHub api constraint. Annotations are limited to 50 items max.
				LOGGER.debug("%s issues were retrieved. Limiting reported results to 50.", event.payload.annotations.length);

				// capping to 50 items
				event.payload.annotations = event.payload.annotations.slice(0, 50);
			} else {
				LOGGER.debug("annotating %s issues to check result", event.payload.annotations.length);
			}

			checkCreateParams.output.annotations = event.payload.annotations.map(item => {
				return {
					path: item.path,
					start_line: item.start || 1,
					end_line: item.end || 1,
					title: item.title,
					message: item.detail,
					annotation_level: item.severity
				} as ChecksCreateParamsOutputAnnotations;
			});
		}

		// send check run status to GitHub
		this.githubClientService
			.createCheckStatus(checkCreateParams)
			.then(() => {
				LOGGER.info("check status update (%s) for %s/%s@%s was sent to github", checkCreateParams.conclusion, event.owner, event.repo, event.payload.sha);
			})
			.catch((error: any) => {
				LOGGER.error("could not persist check status for %s with commit id %s", event.repo, event.payload.sha);
				LOGGER.error(error);
			});

		return checkCreateParams;
	}
}

export default CommitStatusSender;