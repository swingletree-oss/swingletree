import { RedisClient, ClientOpts } from "redis";
import { ConfigurationService } from "../../configuration";
import { inject } from "inversify";
import { injectable } from "inversify";

@injectable()
class TokenStorage {
	private client: RedisClient;

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService
	) {
		this.client = new RedisClient({
			host: configService.get().storage.database
		});

		this.client.auth(configService.get().storage.password);
		this.client.select(2);
	}

	/** Stores a bearer token
	 *
	 * @param login github organization or user name
	 * @param token bearer token
	 */
	public store(login: string, token: BearerToken) {
		const ttl = (new Date(token.expires)).getTime() - Date.now();
		this.client.set(login, token.token, "PX", ttl);
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
	public expires: string;
}

export default TokenStorage;