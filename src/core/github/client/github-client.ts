import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import { inject } from "inversify";
import { injectable } from "inversify";

import { ConfigurationService } from "../../config/configuration";

import InstallationStorage from "./installation-storage";
import TokenStorage from "./token-storage";
import { LOGGER } from "../../logger";

import * as Github from "@octokit/rest";
import { ChecksCreateParams } from "@octokit/rest";

@injectable()
class GithubClientService {
	private configurationService: ConfigurationService;
	private installationStorage: InstallationStorage;
	private tokenStorage: TokenStorage;
	private key: string;
	private clientLogConfig: object = {};

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(TokenStorage) tokenStorage: TokenStorage,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.key = fs.readFileSync(configurationService.get().github.keyFile).toString();
		this.configurationService = configurationService;
		this.tokenStorage = tokenStorage;
		this.installationStorage = installationStorage;

		LOGGER.info("Github client configured to use %s", this.configurationService.get().github.base);

		if (configurationService.get().github.clientDebug) {
			this.clientLogConfig = console;
		}
	}

	public async getInstallations(): Promise<Github.AppsListInstallationsResponseItem[]> {
		const client = this.getClient();
		const options = client.apps.listInstallations.endpoint.merge({});
		try {
			return await client.paginate(options) as Github.AppsListInstallationsResponseItem[];
		} catch (err) {
			LOGGER.error("An error occurred while fetching the installations. Please check your GitHub App private key.");
			throw err;
		}
	}

	public async createCheckStatus(createParams: ChecksCreateParams): Promise<Github.Response<Github.ChecksCreateResponse>> {
		const client = await this.getGhAppClient(createParams.owner);
		return await client.checks.create(createParams);
	}

	public async getCheckSuitesOfRef(params: Github.ChecksListSuitesForRefParams): Promise<Github.Response<Github.ChecksListSuitesForRefResponse>> {
		try {
			const client = await this.getGhAppClient(params.owner);
			return await client.checks.listSuitesForRef(params);
		} catch (err) {
			LOGGER.debug("could not retrieve check suites for ref %s/%s@%s", params.owner, params.repo, params.ref);
			throw err;
		}
	}

	public async isOrganizationKnown(login: string): Promise<boolean> {
		return await this.installationStorage.getInstallationId(login) != null;
	}

	private createJWT(): string {
		const payload = {
			iss: this.configurationService.get().github.appId.toString()
		};

		const token = jwt.sign(payload, this.key, { expiresIn: "3m", algorithm: "RS256"});
		return token;
	}

	private getClient(): Github {
		const context = this;
		const ghClient = new Github({
			baseUrl: this.configurationService.get().github.base,
			auth () {
				return `Bearer ${context.createJWT()}`;
			},
			log: this.clientLogConfig
		});

		return ghClient;
	}

	private async getGhAppClient(login: string): Promise<Github> {
		let installationId: number;
		let bearerToken: string;
		try {
			LOGGER.debug("try to retrieve installation id from storage..");
			installationId = await this.installationStorage.getInstallationId(login);

			if (installationId == null) {
				return Promise.reject(`Swingletree seems not to be installed on repository ${login}`);
			}
		} catch (err) {
			LOGGER.warn("failed to retrieve installation id", err);
			return Promise.reject("installation id was not found for login " + login);
		}

		try {
			LOGGER.debug("looking up bearer token from cache..");
			bearerToken = await this.tokenStorage.getToken(login);
		} catch (err) {
			LOGGER.warn("an error occurred while trying to retrieve the bearer token. Trying to compensate..", err);
			bearerToken = null;
		}

		if (!bearerToken) {
			LOGGER.info("bearer for %s seems to have reached ttl. requesting new bearer.", login);
			try {
				const bearerClient = this.getClient();
				const bearerRequest = await bearerClient.apps.createInstallationToken({
					installation_id: installationId
				});

				this.tokenStorage.store(login, bearerRequest.data);
				bearerToken = bearerRequest.data.token;
			} catch (err) {
				return Promise.reject(err);
			}
		}

		return new Promise<any>((resolve) => {
			resolve(
				new Github({
					baseUrl: this.configurationService.get().github.base,
					auth: `token ${bearerToken}`,
					log: this.clientLogConfig
				})
			);
		});
	}

}

export default GithubClientService;