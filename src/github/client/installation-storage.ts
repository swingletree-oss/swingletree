import { RedisClient } from "redis";
import { inject } from "inversify";
import { injectable } from "inversify";
import RedisClientFactory, { DATABASE_INDEX } from "../../db/redis-client";
import { LOGGER } from "../../logger";

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

	public flush() {
		return new Promise<void>((resolve, reject) => {
			this.client.flushdb(() => {
				resolve();
			});
		});
	}

	public getInstallationId(login: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			this.client.get(login, (err, value) => {
				if (err && value != null) {
					reject(err);
				} else {
					resolve(Number(value));
				}
			});
		});
	}

	public keyCount(): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			this.client.dbsize((err, size) => {
				if (err && size != null) {
					LOGGER.debug("failed to retrieve database size. Skipping cache sync");
					reject(err);
				} else {
					resolve(size);
				}
			});
		});
	}

}

export default InstallationStorage;