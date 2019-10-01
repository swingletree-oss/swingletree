"use strict";

import { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import { ComponentWebhook } from "../core/components/abstract-webhook";
import EventBus from "../core/event/event-bus";
import InstallationStorage from "../core/github/client/installation-storage";
import { Swingletree } from "../core/model";
import { LOGGER } from "../logger";
import { SonarWebhookEvent } from "./client/sonar-wehook-event";
import { SonarAnalysisCompleteEvent } from "./events";
import { SonarConfig } from "./sonar-config";

/** Provides a Webhook for Sonar
 */
@injectable()
class SonarWebhook extends ComponentWebhook {
	public static readonly IGNORE_ID = "sonar";

	private eventBus: EventBus;
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		super("SonarQube", configurationService.get(SonarConfig.SECRET));

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

	initializeRouterMappings(router: Router) {
		router.post("/", this.webhook);
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