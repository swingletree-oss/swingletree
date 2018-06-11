import { RedisClient, ClientOpts } from "redis";
import { ConfigurationService } from "../../configuration";
import { inject } from "inversify";
import { injectable } from "inversify";
import { LOGGER } from "../../logger";
import RedisClientFactory, { DATABASE_INDEX } from "../../redis-client";

@injectable()
class TokenStorage {
	private client: RedisClient;

	constructor(
		@inject(RedisClientFactory) redisClientFactory: RedisClientFactory
	) {
		this.client = redisClientFactory.createClient(DATABASE_INDEX.TOKEN_STORAGE);
	}

	/** Stores a bearer token
	 *
	 * @param login github organization or user name
	 * @param token bearer token
	 */
	public store(login: string, token: BearerToken) {
		const ttl = (new Date(token.expires_at)).getTime() - Date.now();
		this.client.set(login, token.token, "PX", ttl, (err) => {
			if (err) {
				LOGGER.warn("failed to persist token for login %s: %s", login, err);
			}
		});
	}

	/** Gets the bearer token for a user, if available
	 *
	 * @param login github organization or user name
	 * @returns bearer token as string (if available), otherwise null
	 */
	public getToken(login: string): Promise<string> {
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

class BearerToken {
	public token: string;
	public expires_at: string;
}

export default TokenStorage;