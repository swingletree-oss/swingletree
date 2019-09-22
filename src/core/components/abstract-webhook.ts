import { Router } from "express";
import { WebServer } from "../webserver";
import { LOGGER } from "../../logger";
import { injectable } from "inversify";

@injectable()
export abstract class ComponentWebhook {
	private name: string;

	constructor(name: string) {
		this.name = name;
	}

	public getRoute(webhookSecret?: string): Router {
		const router = Router();

		if (webhookSecret && webhookSecret.trim().length > 0) {
			router.use(WebServer.simpleAuthenticationMiddleware(webhookSecret));
		} else {
			LOGGER.warn(`${this.name} webhook is not protected. Consider setting a sonar secret in the Swingletree configuration.`);
		}

		this.initializeRouterMappings(router);

		return router;
	}

	/** Configure your Component Webhook route in this method */
	abstract initializeRouterMappings(router: Router): void;
}