import { RepositoryConfigPluginItem } from "../core/event/event-model";

export enum SonarConfig {
	SECRET = "sonar:secret",
	BASE = "sonar:base",
	CONTEXT = "sonar:context",
	TOKEN = "sonar:token",
	LOG_WEBHOOK_EVENTS = "sonar:debug",
	ENABLED = "sonar:enabled"
}

export namespace SonarConfig {
	export interface SonarRepoConfig extends RepositoryConfigPluginItem {
		blockCoverageLoss: boolean;
	}

	export class DefaultRepoConfig implements SonarRepoConfig {
		enabled: boolean;
		blockCoverageLoss: boolean;

		constructor(repoConfig?: SonarRepoConfig) {
			if (repoConfig) {
				this.blockCoverageLoss = repoConfig.blockCoverageLoss;
			} else {
				this.enabled = false;
				this.blockCoverageLoss = false;
			}
		}
	}
}