import { RedisClient, ClientOpts } from "redis";
import ConfigurationService from "../../configuration";
import { inject } from "inversify";
import { injectable } from "inversify";

@injectable()
class InstallationStorage {
	private client: RedisClient;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService
	) {
		this.client = new RedisClient({
			host: configService.get().storage.database
		});

		this.client.auth(configService.get().storage.password);
		this.client.select(1);
	}

	public store(login: string, installationId: number) {
		this.client.set(login, installationId.toString());
	}

	public exists(login: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
				this.client.exists(login, (err, value) => {
				if (err) {
					reject(err);
				} else {
					resolve(value > 0);
				}
			});
		});
	}

	public getInstallationId(login: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.client.get(login, (err, value) => {
				if (err) {
					reject(err);
				} else {
					resolve(value);
				}
			});
		});
	}

}

export default InstallationStorage;