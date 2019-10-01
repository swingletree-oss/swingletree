import { Router } from "express";
import { WebServer } from "../webserver";
import { LOGGER } from "../../logger";
import { injectable } from "inversify";

@injectable()
export abstract class ComponentWebhook {
	private name: string;
	protected secret: string;

	constructor(name: string, secret: string) {
		this.name = name;
		this.secret = secret;
	}

	public getRoute(): Router {
		const router = Router();

		if (this.secret && this.secret.trim().length > 0) {
			router.use(WebServer.simpleAuthenticationMiddleware(this.secret));
		} else {
			LOGGER.warn(`${this.name} webhook is not protected. Consider setting a sonar secret in the Swingletree configuration.`);
		}

		this.initializeRouterMappings(router);

		return router;
	}

	/** Configure your Component Webhook route in this method */
	abstract initializeRouterMappings(router: Router): void;
}