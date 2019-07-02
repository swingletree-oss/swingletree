import * as fs from "fs";
import * as jwt from "jsonwebtoken";

import { inject } from "inversify";
import { injectable } from "inversify";

import { ConfigurationService } from "../../../configuration";

import InstallationStorage from "./installation-storage";
import TokenStorage from "./token-storage";
import { LOGGER } from "../../../logger";

import { CoreConfig } from "../../core-config";

import * as Github from "@octokit/rest";
import { ChecksCreateParams } from "@octokit/rest";

import * as yaml from "js-yaml";

@injectable()
class GithubClientService {
	private installationStorage: InstallationStorage;
	private tokenStorage: TokenStorage;
	private key: string;
	private clientLogConfig: object = {};

	private baseUrl: string;
	private appId: string;

	constructor(
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(TokenStorage) tokenStorage: TokenStorage,
		@inject(InstallationStorage) installationStorage: InstallationStorage
	) {
		this.key = fs.readFileSync(configurationService.get(CoreConfig.Github.KEYFILE)).toString();

		this.tokenStorage = tokenStorage;
		this.installationStorage = installationStorage;

		this.appId = configurationService.get(CoreConfig.Github.APPID);
		this.baseUrl = configurationService.get(CoreConfig.Github.BASE).replace(/\/+$/, ""); // remove trailing slashes
		LOGGER.info("Github client configured to use %s", this.baseUrl);

		if (configurationService.getBoolean(CoreConfig.Github.CLIENT_DEBUG)) {
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

	public async getSwingletreeConfigFromRepository(owner: string, repo: string) {
		const client = await this.getGhAppClient(owner);
		const response = await client.repos.getContents({
			owner: owner,
			repo: repo,
			path: ".swingletree.yml"
		});

		return yaml.safeLoad(Buffer.from(response.data.content, "base64").toString());
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
			iss: this.appId
		};

		const token = jwt.sign(payload, this.key, { expiresIn: "3m", algorithm: "RS256"});
		return token;
	}

	private getClient(): Github {
		const context = this;
		const ghClient = new Github({
			baseUrl: this.baseUrl,
			auth () {
				return `Bearer ${context.createJWT()}`;
			},
			log: this.clientLogConfig
		});

		return ghClient;
	}

	private async retrieveInstallationId(login: string): Promise<number> {
		let installationId: number;

		try {
			LOGGER.debug("try to retrieve installation id from storage..");
			installationId = await this.installationStorage.getInstallationId(login);

			if (installationId == null) {
				throw new Error(`Swingletree seems not to be installed on repository ${login}`);
			}

			return installationId;
		} catch (err) {
			LOGGER.warn("failed to retrieve installation id", err);
			throw err;
		}
	}

	private async retrieveBearerToken(login: string): Promise<string> {
		try {
			LOGGER.debug("looking up bearer token from cache..");
			let bearerToken = await this.tokenStorage.getToken(login);

			// on cache miss
			if (bearerToken == null) {
				LOGGER.info("bearer for %s seems to have reached ttl. requesting new bearer.", login);
				try {
					const bearerClient = this.getClient();
					const bearerRequest = await bearerClient.apps.createInstallationToken({
						installation_id: await this.retrieveInstallationId(login)
					});

					// cache token
					this.tokenStorage.store(login, bearerRequest.data);

					// extract token
					bearerToken = bearerRequest.data.token;
				} catch (err) {
					throw new Error("failed to request new bearer token. " + err);
				}
			}

			return bearerToken;
		} catch (err) {
			LOGGER.warn("an error occurred while trying to retrieve the bearer token.", err);
			throw err;
		}
	}

	private async getGhAppClient(login: string): Promise<Github> {
		const bearerToken = await this.retrieveBearerToken(login);

		return new Promise<any>((resolve) => {
			resolve(
				new Github({
					baseUrl: this.baseUrl,
					auth: `token ${bearerToken}`,
					log: this.clientLogConfig
				})
			);
		});
	}
}



export default GithubClientService;