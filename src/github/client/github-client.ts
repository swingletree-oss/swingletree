import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import Identifiers from "../../ioc/identifiers";
import { inject } from "inversify";
import { injectable } from "inversify";

import ConfigurationService from "../../configuration";

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

	public getClient(): any {
		const ghClient = Octokit({
			baseUrl: this.configurationService.get().github.baseUrl
		});

		ghClient.authenticate({
			type: "integration",
			token: this.createJWT()
		});

		return ghClient;
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