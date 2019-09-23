"use strict";

import { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import { ComponentWebhook } from "../core/components/abstract-webhook";
import EventBus from "../core/event/event-bus";
import InstallationStorage from "../core/github/client/installation-storage";
import { Swingletree } from "../core/model";
import { LOGGER } from "../logger";
import { NebulaConfig } from "./config";
import { NebulaEvents } from "./events";
import { NebulaModel } from "./model";


/** Provides a Webhook for Sonar
 */
@injectable()
export class NebulaWebhook extends ComponentWebhook {
	private eventBus: EventBus;
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		super("Gradle Metrics");

		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.installationStorage = installationStorage;
	}

	private isWebhookEventRelevant(event: NebulaModel.Report) {

		return event.payload &&
			event.payload.build &&
			event.payload.build.result &&
			event.payload.build.result.status != NebulaModel.ResultValue.UNKNOWN;
	}


	initializeRouterMappings(router: Router) {
		router.post("/", this.webhook);
	}

	public webhook = async (req: Request, res: Response) => {
		LOGGER.debug("received gradle-metrics webhook event");

		const org = req.header("X-swingletree-org");
		const repo = req.header("X-swingletree-repo");
		const sha = req.header("X-swingletree-sha");
		const branch = req.header("X-swingletree-branch");

		if (this.configurationService.getBoolean(NebulaConfig.LOG_WEBHOOK_EVENTS)) {
			LOGGER.debug(JSON.stringify(req.body));
		}

		try {
			req.body.payload.build = JSON.parse(req.body.payload.build);
		} catch (err) {
			LOGGER.warn("failed to parse gradle-metrics build payload. Skipping event.");
			res.status(400).send("could not parse build payload. Check your request.");
			return;
		}

		const webhookData: NebulaModel.Report = req.body;

		if (org == null || repo == null || sha == null || branch == null) {
			res.status(400).send("missing at least one of following http headers: X-swingletree-org, X-swingletree-repo, X-swingletree-sha, X-swingletree-branch");
			return;
		}

		const source = new Swingletree.GithubSource();
		source.owner = org;
		source.repo = repo;
		source.branch = [ branch ];
		source.sha = sha;

		if (this.isWebhookEventRelevant(webhookData)) {
			const reportReceivedEvent = new NebulaEvents.ReportReceivedEvent(webhookData, source);

			// check if installation is available
			if (await this.installationStorage.getInstallationId(org)) {
				this.eventBus.emit(reportReceivedEvent);
			} else {
				LOGGER.info("ignored gradle metrics report for %s/%s. Swingletree may not be installed in this organization.", org, repo);
			}
		} else {
			LOGGER.debug("gradle-metrics webhook data did not contain a report. This event will be ignored.");
			res.status(400).send("gradle-metrics webhook data did not contain a report. This event will be ignored.");
			return;
		}

		res.status(204).send();
	}
}

export default NebulaWebhook;