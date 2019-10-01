"use strict";

import { LOGGER } from "../../logger";
import GithubClientService from "./client/github-client";
import { injectable, inject } from "inversify";
import EventBus from "../event/event-bus";
import { Events, NotificationEvent } from "../event/event-model";
import { ChecksCreateParams, ChecksCreateParamsOutputAnnotations } from "@octokit/rest";
import { Swingletree } from "../model";


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

	private convertToConclusion(conclusion: Swingletree.Conclusion): "success" | "action_required" | "neutral" | "failure" {
		let result: "success" | "action_required" | "neutral" | "failure" = "neutral";

		switch (conclusion) {
			case Swingletree.Conclusion.PASSED: result = "success"; break;
			case Swingletree.Conclusion.BLOCKED: result = "action_required"; break;
			case Swingletree.Conclusion.UNDECISIVE: result = "neutral"; break;
			case Swingletree.Conclusion.ANALYSIS_FAILURE: result = "failure"; break;
		}

		return result;
	}

	private convertSwingletreeSeverity(severity: Swingletree.Severity): "notice" | "warning" | "failure" {
		let result: "notice" | "warning" | "failure" = "notice";

		switch (severity) {
			case Swingletree.Severity.BLOCKER: result = "failure"; break;
			case Swingletree.Severity.MAJOR:
			case Swingletree.Severity.WARNING: result = "warning"; break;
			case Swingletree.Severity.WARNING: result = "warning"; break;
		}

		return result;
	}

	private convertToCheckAnnotations(annotations: Swingletree.Annotation[]): ChecksCreateParamsOutputAnnotations[] {
		const converted = annotations.filter(i => i instanceof Swingletree.FileAnnotation)
			.map(annotation => {
				const item = annotation as Swingletree.FileAnnotation;
				return {
					path: item.path,
					start_line: item.start || 1,
					end_line: item.end || 1,
					title: item.title,
					message: item.detail,
					annotation_level: this.convertSwingletreeSeverity(item.severity)
				} as ChecksCreateParamsOutputAnnotations;
			});

		if (converted.length == 0) {
			return undefined;
		}

		return converted;
	}

	public async sendAnalysisStatus(event: NotificationEvent) {

		if (!(event.payload.source instanceof Swingletree.GithubSource)) {
			LOGGER.debug("skipping GitHub notification. This event is not targeting a github repository");
			return;
		}

		const githubSource = event.source as Swingletree.GithubSource;

		try {
			if (!(await this.githubClientService.isOrganizationKnown(githubSource.owner))) {
				LOGGER.debug("ignoring webhook event for unknown organization %s.", githubSource.owner);
				return;
			}
		} catch (err) {
			LOGGER.error("failed to look up organization %s in installation cache", githubSource.owner);
			return;
		}

		const checkCreateParams: ChecksCreateParams = {
			head_sha: githubSource.sha,
			owner: githubSource.owner,
			repo: githubSource.repo,
			details_url: event.payload.link,
			name: event.payload.sender,
			output: {
				title: event.payload.title,
				summary: event.markdown || event.payload.shortMessage || ""
			}
		};

		if (event.payload.checkStatus) {
			checkCreateParams.conclusion = this.convertToConclusion(event.payload.checkStatus);
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

			checkCreateParams.output.annotations = this.convertToCheckAnnotations(event.payload.annotations);
		}

		// send check run status to GitHub
		this.githubClientService
			.createCheckStatus(checkCreateParams)
			.then(() => {
				LOGGER.info("check status update (%s) for %s/%s@%s was sent to github", checkCreateParams.conclusion, githubSource.owner, githubSource.repo, githubSource.sha);
			})
			.catch((error: any) => {
				LOGGER.error("could not persist check status for %s with commit id %s", githubSource.repo, githubSource.sha);
				LOGGER.error(JSON.stringify(error, null, 2));
			});

		return checkCreateParams;
	}
}

export default CommitStatusSender;