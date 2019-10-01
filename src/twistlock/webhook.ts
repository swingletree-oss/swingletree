"use strict";

import { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import { ComponentWebhook } from "../core/components/abstract-webhook";
import EventBus from "../core/event/event-bus";
import InstallationStorage from "../core/github/client/installation-storage";
import { Swingletree } from "../core/model";
import { LOGGER } from "../logger";
import { TwistlockConfig } from "./config";
import { TwistlockReportReceivedEvent } from "./events";
import { TwistlockModel } from "./model";

/** Provides a Webhook for Sonar
 */
@injectable()
class TwistlockWebhook extends ComponentWebhook {
	private eventBus: EventBus;
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		super("Twistlock", configurationService.get(TwistlockConfig.SECRET));

		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.installationStorage = installationStorage;
	}

	private isWebhookEventRelevant(event: TwistlockModel.Report) {
		return event.results && event.results.length > 0;
	}


	initializeRouterMappings(router: Router) {
		router.post("/", this.webhook);
	}

	public webhook = async (req: Request, res: Response) => {
		LOGGER.debug("received Twistlock webhook event");

		const org = req.query["org"];
		const repo = req.query["repo"];
		const sha = req.query["sha"];
		const branch = req.query["branch"];

		if (this.configurationService.getBoolean(TwistlockConfig.LOG_WEBHOOK_EVENTS)) {
			LOGGER.debug(JSON.stringify(req.body));
		}

		const webhookData: TwistlockModel.Report = req.body;

		if (org == null || repo == null || sha == null || branch == null) {
			res.status(400).send("missing at least one of following query parameters: org, repo, sha, branch");
			return;
		}

		const source = new Swingletree.GithubSource();
		source.owner = org;
		source.repo = repo;
		source.branch = [ branch ];
		source.sha = sha;

		if (this.isWebhookEventRelevant(webhookData)) {
			const reportReceivedEvent = new TwistlockReportReceivedEvent(webhookData, source);

			// check if installation is available
			if (await this.installationStorage.getInstallationId(org)) {
				this.eventBus.emit(reportReceivedEvent);
			} else {
				LOGGER.info("ignored twistlock report for %s/%s. Swingletree may not be installed in this organization.", org, repo);
			}
		} else {
			LOGGER.debug("twistlock webhook data did not contain a report. This event will be ignored.");
			res.status(400).send("twistlock webhook data did not contain a report. This event will be ignored.");
			return;
		}

		res.status(204).send();
	}
}

export default TwistlockWebhook;