import { injectable } from "inversify";
import * as Nunjucks from "nunjucks";
import { LOGGER } from "../logger";

@injectable()
export class TemplateEngine {

	private readonly environment: Nunjucks.Environment;

	constructor() {
		this.environment = Nunjucks.configure("templates");
	}

	/** Gets and fills a template
	 *
	 * @param template Template to use
	 * @param context context supplied to the template
	 */
	public template(template: Templates, context: object): string {
		LOGGER.debug("processing template %s", template);
		return this.environment.render(template, context);
	}
}

export enum Templates {
	/** Template for GitHub Check Run summaries */
	CHECK_RUN_SUMMARY = "check-run/summary.md"
}