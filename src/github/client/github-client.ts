import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import Identifiers from "../../ioc/identifiers";
import { inject } from "inversify";
import { injectable } from "inversify";

import ConfigurationService from "../../configuration";
import { GitHubGhCommitStatusContainer } from "../model/gh-commit-status";

const Octokit = require("@octokit/rest");

@injectable()
class GithubClientService {
	private configurationService: ConfigurationService;
	private key: string;

	constructor(
		@inject(Identifiers.ConfigurationService) configurationService: ConfigurationService
	) {
		this.key = fs.readFileSync(configurationService.get().github.keyFile).toString();
	}

	private getClient(): any {
		const ghClient = Octokit({
			baseUrl: this.configurationService.get().github.baseUrl
		});

		ghClient.authenticate({
			type: "integration",
			token: this.createJWT()
		});

		return ghClient;
	}

	public createCommitStatus(status: GitHubGhCommitStatusContainer): Promise<void> {
		const coordinates = status.repository.split("/");
		const client = this.getClient();

		return client.repos.createStatus({
			owner: coordinates[0],
			repo: coordinates[1],
			sha: status.commitId,
			state: status.payload.state,
			target_url: status.payload.target_url,
			description: status.payload.description,
			context: this.configurationService.get().context
		});
	}

	private createJWT(): string {
		const payload = {
			iss: this.configurationService.get().github.appId
		};

		const token = jwt.sign(payload, this.key, { expiresIn: "1m", algorithm: "RS256"});
		return token;
	}
}

export default GithubClientService;