import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import { inject } from "inversify";
import { injectable } from "inversify";

import ConfigurationService from "../../configuration";
import { GitHubGhCommitStatusContainer } from "../model/gh-commit-status";

import InstallationStorage from "./installation-storage";
import TokenStorage from "./token-storage";
import { GhInstallation } from "../model/gh-webhook-event";

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

	public getInstallations(): Promise<GhInstallation[]> {
		return new Promise<GhInstallation[]>((resolve, reject) => {
			const client = this.getClient();

			client.apps.getInstallations()
			.then((data: any) => {
					const result: GhInstallation[] = [];

					data.installations.forEach((instItem: any) => {
						result.push(new GhInstallation(instItem));
					});

					resolve(result);
				});
		});
	}

	private getClient(): any {
		const ghClient = Octokit({
			baseUrl: this.configurationService.get().github.base
		});

		ghClient.authenticate({
			type: "integration",
			token: this.createJWT()
		});

		return ghClient;
	}

	private async getGhAppClient(login: string): Promise<any> {
		const ghClient = Octokit({
			baseUrl: this.configurationService.get().github.base
		});

		ghClient.authenticate({
			type: "integration",
			token: this.createJWT()
		});

		const installationId = await this.installationStorage.getInstallationId(login);

		return new Promise<any>((resolve, reject) => {
			if (!installationId) {
				reject("installation id was not found for login " + login);
			}

			ghClient.apps.createInstallationToken({
				installation_id: installationId
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
			const client = await this.getGhAppClient(status.repository.split("/")[0]);

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
			iss: this.configurationService.get().github.appId.toString()
		};

		const token = jwt.sign(payload, this.key, { expiresIn: "3m", algorithm: "RS256"});
		return token;
	}
}

export default GithubClientService;