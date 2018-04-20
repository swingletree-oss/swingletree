import * as yaml from "js-yaml";

export class ConfigurationLoader {
	private static readonly CONFIG_FILE = "swingletree.config.yaml";
	private static config: Configuration;

	public static load(): Configuration {
		if (!this.config) {
			this.config = yaml.load(this.CONFIG_FILE) as Configuration;
		}

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