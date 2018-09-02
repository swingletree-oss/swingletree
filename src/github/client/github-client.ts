import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import { inject } from "inversify";
import { injectable } from "inversify";

import { ConfigurationService } from "../../configuration";

import InstallationStorage from "./installation-storage";
import TokenStorage from "./token-storage";
import { LOGGER } from "../../logger";

import * as Github from "@octokit/rest";
import { AuthJWT, AuthUserToken, ChecksCreateParams } from "@octokit/rest";
import { GithubInstallation } from "../model/gh-webhook-event";
import { ClientResponse } from "http";

@injectable()
class GithubClientService {
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;
	private tokenStorage: TokenStorage;
	private key: string;

	private githubOptions: Github.Options;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(TokenStorage) tokenStorage: TokenStorage,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.key = fs.readFileSync(configurationService.get().github.keyFile).toString();
		this.configurationService = configurationService;
		this.tokenStorage = tokenStorage;
		this.installationStorage = installationStorage;

		this.githubOptions = {
			baseUrl: this.configurationService.get().github.base
		};
	}

	public getInstallations(): Promise<GithubInstallation[]> {
		return new Promise<GithubInstallation[]>((resolve, reject) => {
			const client = this.getClient();

			client.apps.getInstallations({})
			.then((response: any) => {
					const result: GithubInstallation[] = [];

					let instItem: any;
					for (instItem in response.data) {
						result.push(response.data[instItem]);
					}

					resolve(result);
				})
			.catch(reject);
		});
	}

	public createCheckStatus(createParams: ChecksCreateParams): Promise<Github.Response<Github.CreateResponse>> {

		return new Promise<Github.Response<Github.CreateResponse>>(async (resolve, reject) => {

			const client = await this.getGhAppClient(createParams.owner);

			client.checks.create(createParams)
			.then(resolve)
			.catch(reject);
		});
	}

	public getCheckSuiteForRef(repo: string, ref: string): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			const coordinates = repo.split("/");
			const client = await this.getGhAppClient(coordinates[0]);

			client.checks.listSuitesForRef({
				app_id: this.configurationService.get().github.appId,
				owner: coordinates[0],
				repo: coordinates[1],
				ref: ref
			});
		});
	}

	private createJWT(): string {
		const payload = {
			iss: this.configurationService.get().github.appId.toString()
		};

		const token = jwt.sign(payload, this.key, { expiresIn: "3m", algorithm: "RS256"});
		return token;
	}

	private getClient(): Github {
		const ghClient = new Github(this.githubOptions);

		const auth: AuthJWT = {
			type: "app",
			token: this.createJWT()
		};

		ghClient.authenticate(auth);

		return ghClient;
	}

	private async getGhAppClient(login: string): Promise<Github> {
		const ghClient = new Github(this.githubOptions);

		const installationId = await this.installationStorage.getInstallationId(login);
		if (!installationId) {
			return Promise.reject("installation id was not found for login " + login);
		}

		let bearerToken = await this.tokenStorage.getToken(login);
		if (!bearerToken) {
			LOGGER.info("bearer for %s seems to have reached ttl. requesting new bearer.", login);
			try {
				const auth: AuthJWT = {
					type: "app",
					token: this.createJWT()
				};
				ghClient.authenticate(auth);

				const bearerRequest = await ghClient.apps.createInstallationToken({
					installation_id: installationId
				});

				this.tokenStorage.store(login, bearerRequest.data);
				bearerToken = bearerRequest.data.token;
			} catch (err) {
				return Promise.reject(err);
			}
		}

		return new Promise<any>((resolve, reject) => {
			const auth: AuthUserToken = {
				type: "token",
				token: bearerToken
			};
			ghClient.authenticate(auth);

			resolve(ghClient);
		});
	}

}

export default GithubClientService;