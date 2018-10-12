import { injectable } from "inversify";
import * as Nunjucks from "nunjucks";
import { LOGGER } from "../logger";

@injectable()
export class TemplateEngine {

	private readonly environment: Nunjucks.Environment;

	constructor() {
		this.environment = Nunjucks.configure("templates");
		this.environment.addFilter("gateStatusIcon", this.qualityGateStatusIconFilter);
	}

	/** Gets and fills a template
	 *
	 * @param template Template to use
	 * @param context context supplied to the template
	 */
	public template<T extends TemplateData>(template: Templates, context: T): string {
		LOGGER.debug("processing template %s", template);
		return this.environment.render(template, context);
	}

	public qualityGateStatusIconFilter(str: string) {
		if (str == "OK") return ":large_blue_circle:";
		if (str == "ERROR") return ":red_circle:";
		if (str == "NO_VALUE") return ":white_circle:";

		return "";
	}
}

export enum Templates {
	/** Template for GitHub Check Run summaries */
	CHECK_RUN_SUMMARY = "check-run/summary.md.tpl"
}

export interface TemplateData {
}
