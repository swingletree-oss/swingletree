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
			host: this.configService.get().storage.database,
			retry_strategy: (options) => {
				return 5000;
			}
		});

		client.on("error", function (err) {
			if (err.code == "ECONNREFUSED") {
				LOGGER.error("Redis client for index %i has trouble connecting to the database: %s", databaseIndex, err.message);
			} else {
				LOGGER.error("database error for index %i! %s", databaseIndex, err.message);
			}
		});

		client.on("ready", () => {
			LOGGER.info("Redis client for database index %i is connected and ready.", databaseIndex);
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