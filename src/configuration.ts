import * as yaml from "js-yaml";
import { injectable } from "inversify";

@injectable()
class ConfigurationService {
	private readonly CONFIG_FILE = "swingletree.config.yaml";
	private config: Configuration;

	constructor() {
		this.config = yaml.load(this.CONFIG_FILE) as Configuration;
	}

	public get(): Configuration {
		return this.config;
	}
}

class Configuration {
	public github: GithubConfig;
	public sonar: SonarConfig;

	public context: string;
}

class GithubConfig {
	public appId: number;
	public keyFile: string;
	public baseUrl: string;
}

class SonarConfig {
	public token: string;
	public base: string;
}

export default ConfigurationService;