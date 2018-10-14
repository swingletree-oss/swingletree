"use strict";

import { Router, Request, Response, NextFunction } from "express";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { injectable } from "inversify";
import { inject } from "inversify";
import EventBus from "../event/event-bus";
import { ConfigurationService } from "../configuration";
import * as BasicAuth from "basic-auth";
import { LOGGER } from "../logger";
import { SonarAnalysisCompleteEvent } from "../event/event-model";

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
			return event.properties.commitId !== undefined &&
				event.properties.repository !== undefined;
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
		const secret = this.configurationService.get().sonar.secret;

		if (secret && secret.trim().length > 0) {
			router.use(this.authenticationMiddleware(secret));
		} else {
			LOGGER.warn("SonarQube webhook is not protected. Consider setting a sonar secret in the Swingletree configuration.");
		}
		router.post("/", this.webhook);

		return router;
	}

	public webhook = (req: Request, res: Response) => {
		LOGGER.debug("received SonarQube webhook event");

		if (this.configurationService.get().sonar.logWebhookEvents) {
			LOGGER.debug(JSON.stringify(req.body));
		}

		const analysisEvent = new SonarWebhookEvent(req.body);

		if (this.isWebhookEventRelevant(analysisEvent)) {
			this.eventBus.emit(
				new SonarAnalysisCompleteEvent(analysisEvent)
			);
		} else {
			LOGGER.debug("SonarQube webhook data did not contain repo and/or commit-sha data. This event will be ignored.");
		}

		res.sendStatus(204);
	}
}

export default SonarWebhook;