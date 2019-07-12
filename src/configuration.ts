import * as yaml from "js-yaml";
import { injectable } from "inversify";
import { LOGGER } from "./logger";
import * as nconf from "nconf";

@injectable()
export class ConfigurationService {
	private config: nconf.Provider;

	constructor(file = "./swingletree.conf.yaml") {
		LOGGER.info("loading configuration from file %s", file);

		this.config = new nconf.Provider()
			.env({
				lowerCase: true,
				separator: "_",
				match: /((ST|GITHUB|SONAR|TWISTLOCK|ZAP|STORAGE|LOG)_.*)|(PORT)$/i
			})
			.file({
				file: file,
				format: {
					parse: yaml.safeLoad,
					stringify: yaml.safeDump
				}
			});
	}

	public checkRequired(keys: string[]) {
		this.config.required(keys);
	}

	public get(key: string): string {
		const value: string = this.config.get(key);

		if (!value || value.toString().trim() == "") {
			return null;
		}

		return value;
	}

	public getConfig() {
		return this.config.get();
	}

	public getNumber(key: string): number {
		return Number(this.get(key));
	}

	public getBoolean(key: string): boolean {
		return String(this.get(key)) == "true";
	}
}
