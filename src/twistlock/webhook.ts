"use strict";

import { Router, Request, Response, NextFunction } from "express";
import { injectable } from "inversify";
import { inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { ConfigurationService } from "../configuration";
import * as BasicAuth from "basic-auth";
import { LOGGER } from "../logger";
import InstallationStorage from "../core/github/client/installation-storage";
import { TwistlockModel } from "./model";
import { TwistlockConfig } from "./config";
import { TwistlockReportReceivedEvent } from "./events";

/** Provides a Webhook for Sonar
 */
@injectable()
class TwistlockWebhook {
	private eventBus: EventBus;
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.eventBus = eventBus;
		this.configurationService = configurationService;
		this.installationStorage = installationStorage;
	}

	private isWebhookEventRelevant(event: TwistlockModel.Report) {
		return event.results && event.results.length > 0;
	}

	private authenticationMiddleware(secret: string) {
		return (req: Request, res: Response, next: NextFunction) => {
			const auth = BasicAuth(req);
			if (auth && secret === auth.pass) {
				next();
			} else {
				res.sendStatus(401);
			}
		};
	}

	public getRoute(): Router {
		const router = Router();
		const secret = this.configurationService.get(TwistlockConfig.SECRET);

		if (secret && secret.trim().length > 0) {
			router.use(this.authenticationMiddleware(secret));
		} else {
			LOGGER.warn("Twistlock webhook is not protected. Consider setting a Twistlock secret in the Swingletree configuration.");
		}
		router.post("/", this.webhook);

		return router;
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

		if (this.isWebhookEventRelevant(webhookData)) {
			const reportReceivedEvent = new TwistlockReportReceivedEvent(webhookData, org, repo);
			reportReceivedEvent.commitId = sha;
			reportReceivedEvent.owner = org;
			reportReceivedEvent.repo = repo;
			reportReceivedEvent.branch = branch;

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