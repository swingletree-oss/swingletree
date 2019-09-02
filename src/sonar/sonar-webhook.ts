"use strict";

import { Router, Request, Response, NextFunction } from "express";
import { SonarWebhookEvent } from "./client/sonar-wehook-event";
import { injectable } from "inversify";
import { inject } from "inversify";
import EventBus from "../core/event/event-bus";
import { ConfigurationService } from "../configuration";
import * as BasicAuth from "basic-auth";
import { LOGGER } from "../logger";
import { SonarAnalysisCompleteEvent } from "./events";
import InstallationStorage from "../core/github/client/installation-storage";
import { SonarConfig } from "./sonar-config";
import { Swingletree } from "../core/model";

/** Provides a Webhook for Sonar
 */
@injectable()
class SonarWebhook {
	public static readonly IGNORE_ID = "sonar";

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

	private isWebhookEventRelevant(event: SonarWebhookEvent) {
		if (event.properties !== undefined) {
			return event.properties["sonar.analysis.commitId"] !== undefined &&
				event.properties["sonar.analysis.repository"] !== undefined;
		}

		return false;
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
		const secret = this.configurationService.get(SonarConfig.SECRET);

		if (secret && secret.trim().length > 0) {
			router.use(this.authenticationMiddleware(secret));
		} else {
			LOGGER.warn("SonarQube webhook is not protected. Consider setting a sonar secret in the Swingletree configuration.");
		}
		router.post("/", this.webhook);

		return router;
	}

	public webhook = async (req: Request, res: Response) => {
		LOGGER.debug("received SonarQube webhook event");

		if (this.configurationService.getBoolean(SonarConfig.LOG_WEBHOOK_EVENTS)) {
			LOGGER.debug(JSON.stringify(req.body));
		}

		const webhookData: SonarWebhookEvent = req.body;

		if (this.isWebhookEventRelevant(webhookData)) {
			const coordinates = webhookData.properties["sonar.analysis.repository"].split("/");

			const source = new Swingletree.GithubSource();
			source.owner = coordinates[0];
			source.repo = coordinates[1];
			source.sha = webhookData.properties["sonar.analysis.commitId"];
			source.branch = [ webhookData.properties["sonar.branch.target"] ];

			const analysisEvent = new SonarAnalysisCompleteEvent(webhookData, source);

			if (await this.installationStorage.getInstallationId(coordinates[0])) {
				this.eventBus.emit(analysisEvent);
			} else {
				LOGGER.info("ignored sonarqube analysis for %s/%s. Swingletree may not be installed in this organization.", coordinates[0], coordinates[1]);
			}
		} else {
			LOGGER.debug("SonarQube webhook data did not contain repo and/or commit-sha data. This event will be ignored.");
			res.status(400).send("SonarQube webhook data did not contain repo and/or commit-sha data. This event will be ignored.");
			return;
		}

		res.sendStatus(204);
	}
}

export default SonarWebhook;