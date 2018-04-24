import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import { inject } from "inversify";
import { injectable } from "inversify";

import ConfigurationService from "../../configuration";
import { GitHubGhCommitStatusContainer } from "../model/gh-commit-status";

import { Installation } from "./installation";
import InstallationStorage from "./installation-storage";
import TokenStorage from "./token-storage";

const Octokit = require("@octokit/rest");

@injectable()
class GithubClientService {
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;
	private tokenStorage: TokenStorage;
	private key: string;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(TokenStorage) tokenStorage: TokenStorage,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.key = fs.readFileSync(configurationService.get().github.keyFile).toString();
		this.configurationService = configurationService;
		this.tokenStorage = tokenStorage;
		this.installationStorage = installationStorage;
	}

	private async checkInstallations(ghClient: any, login: string) {
		const installationId = await this.installationStorage.exists(login);
		if (installationId) {
			const installations: Installation[] = (await ghClient.apps.getInstallations()).data;
			// TODO: find installation by login compare
			installations.forEach((inst: Installation) => {
				this.installationStorage.store(login, inst.id);
			});
			const installation: Installation = installations[0];
		}
	}

	private async getClient(login: string): Promise<any> {
		const ghClient = Octokit({
			baseUrl: this.configurationService.get().github.base
		});

		ghClient.authenticate({
			type: "integration",
			token: this.createJWT()
		});

		return new Promise<any>((resolve, reject) => {
			ghClient.apps.createInstallationToken({
				installation_id: installation.id
			})
			.then((response: any) => {
				ghClient.authenticate({
					type: "token",
					token: response.data.token
				});

				resolve(ghClient);
			})
			.catch((err: any) => {
				reject(err);
			});
		});
	}

	public createCommitStatus(status: GitHubGhCommitStatusContainer): Promise<void> {

		return new Promise<void>(async (resolve, reject) => {
			const coordinates = status.repository.split("/");
			const client = await this.getClient();

			client.repos.createStatus({
				owner: coordinates[0],
				repo: coordinates[1],
				sha: status.commitId,
				state: status.payload.state,
				target_url: status.payload.target_url,
				description: status.payload.description,
				context: this.configurationService.get().context
			})
			.then(resolve)
			.catch(reject);
		});
	}

	private createJWT(): string {
		const payload = {
			iss: "" + this.configurationService.get().github.appId
		};

		const token = jwt.sign(payload, this.key, { expiresIn: "3m", algorithm: "RS256"});
		return token;
	}
}

export default GithubClientService;