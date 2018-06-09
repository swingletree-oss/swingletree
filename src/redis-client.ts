import { RedisClient, ClientOpts } from "redis";
import { ConfigurationService } from "./configuration";
import { inject } from "inversify";
import { injectable } from "inversify";
import { LOGGER } from "./logger";

@injectable()
class RedisClientFactory {
	private configService: ConfigurationService;
	private registeredClients: RedisClient[];

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService
	) {
		this.configService = configService;
		this.registeredClients = [];
	}

	public unhealthyConnectionCount() {
		let unhealthyConnections = 0;
		this.registeredClients.forEach((client: RedisClient) => {
			if (!client.connected) {
				unhealthyConnections++;
			}
		});

		return unhealthyConnections;
	}

	public connectionCount() {
		return this.registeredClients.length;
	}

	public createClient(databaseIndex = 0): RedisClient {
		const client = new RedisClient({
			host: this.configService.get().storage.database
		});

		client.on("error", function (err) {
			if (err.code == "ECONNREFUSED") {

			}
			LOGGER.error("database error! %s", err);
		});

		client.auth(this.configService.get().storage.password);
		client.select(databaseIndex);

		this.registeredClients.push(client);

		return client;
	}
}

export enum DATABASE_INDEX {
	TOKEN_STORAGE = 2,
	INSTALLATION_STORAGE = 1
}

export default RedisClientFactory;