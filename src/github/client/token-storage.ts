import { RedisClient, ClientOpts } from "redis";
import ConfigurationService from "../../configuration";
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

	public store(login: string, token: BearerToken) {
		const ttl = (new Date(token.expires)).getTime() - Date.now();
		this.client.set(login, token.token, "PX", ttl);
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