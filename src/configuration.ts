import * as yaml from "js-yaml";
import { injectable } from "inversify";

@injectable()
class ConfigurationService {
	private readonly CONFIG_FILE = "./swingletree.conf.yaml";
	private config: Configuration;

	constructor() {
		this.config = yaml.safeLoad(
			require("fs").readFileSync(this.CONFIG_FILE)
		) as Configuration;
	}

	public get(): Configuration {
		return this.config;
	}
}

class Configuration {
	public github: GithubConfig;
	public sonar: SonarConfig;
	public storage: StorageConfig;
	public context: string;
}

class GithubConfig {
	public appId: number;
	public keyFile: string;
	public base: string;
	public webhookSecret: string;
}

class StorageConfig {
	public database: string;
	public password: string;
}

class SonarConfig {
	public token: string;
	public base: string;
}

export default ConfigurationService;