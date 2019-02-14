import { RedisClient } from "redis";
import { inject } from "inversify";
import { injectable } from "inversify";
import RedisClientFactory, { DATABASE_INDEX } from "../../db/redis-client";
import { LOGGER } from "../../logger";

@injectable()
class InstallationStorage {
	private client: RedisClient;
	private readonly SYNC_KEY = "//SWINGLETREE:LAST_SYNC";
	public static readonly SYNC_INTERVAL = 86400000;

	constructor(
		@inject(RedisClientFactory) redisClientFactory: RedisClientFactory
	) {
		this.client = redisClientFactory.createClient(DATABASE_INDEX.INSTALLATION_STORAGE);
	}

	/** Stores a installation.
	 *
	 *  Cache ttl spans over 4 sync intervals.
	 */
	public store(login: string, installationId: number) {
		this.client.set(login, installationId.toString(), "PX", Math.floor(InstallationStorage.SYNC_INTERVAL * 4));
	}

	public getInstallationId(login: string): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			this.client.get(login, (err, value) => {
				if (err) {
					reject(err);
				} else {
					resolve(Number(value));
				}
			});
		});
	}

	public isSyncRequired(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.client.exists(this.SYNC_KEY, (err, value) => {
				if (err) {
					reject(err);
				} else {
					resolve(value == 0);
				}
			});
		});
	}

	public setSyncFlag() {
		this.client.set(this.SYNC_KEY, Date.now().toString(), "PX", InstallationStorage.SYNC_INTERVAL, (err) => {
			if (err) {
				LOGGER.warn("failed to set cache flag");
			} else {
				LOGGER.debug("sync flag was successfully set.");
			}
		});
	}

	public removeSyncFlag() {
		this.client.del(this.SYNC_KEY, (err) => {
			if (err) {
				LOGGER.warn("failed to delete cache flag");
			} else {
				LOGGER.debug("sync flag was deleted");
			}
		});
	}

}

export default InstallationStorage;