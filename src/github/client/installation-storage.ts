import { RedisClient } from "redis";
import { inject } from "inversify";
import { injectable } from "inversify";
import RedisClientFactory, { DATABASE_INDEX } from "../../redis-client";

@injectable()
class InstallationStorage {
	private client: RedisClient;

	constructor(
		@inject(RedisClientFactory) redisClientFactory: RedisClientFactory
	) {
		this.client = redisClientFactory.createClient(DATABASE_INDEX.INSTALLATION_STORAGE);
	}

	public store(login: string, installationId: number) {
		this.client.set(login, installationId.toString());
	}

	public getInstallationId(login: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.client.get(login, (err, value) => {
				if (err && value != null) {
					reject(err);
				} else {
					resolve(value);
				}
			});
		});
	}

}

export default InstallationStorage;