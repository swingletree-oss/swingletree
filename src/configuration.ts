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
}

class GithubConfig {
	public appId: number;
	public keyFile: string;
	public baseUrl: string;
}

export default ConfigurationService;