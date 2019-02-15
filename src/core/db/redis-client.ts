import { RedisClient } from "redis";
import { ConfigurationService } from "../../configuration";
import { inject } from "inversify";
import { injectable } from "inversify";
import { LOGGER } from "../logger";
import EventBus from "../event/event-bus";
import { DatabaseReconnectEvent, HealthStatusEvent } from "../event/event-model";
import { HealthState } from "../health-service";

@injectable()
class RedisClientFactory {
	private eventBus: EventBus;
	private configService: ConfigurationService;

	private registeredClients: RedisClient[];

	constructor(
		@inject(ConfigurationService) configService: ConfigurationService,
		@inject(EventBus) eventBus: EventBus
	) {
		this.registeredClients = [];

		this.configService = configService;
		this.eventBus = eventBus;

		if (!configService.get().storage.password) {
			LOGGER.warn("Redis client is configured to use no authentication. Please consider securing the database.");
		}
	}

	public performHealthCheck() {
		const unhealthy = this.unhealthyConnectionCount();
		const total = this.connectionCount();

		this.eventBus.emit(
			new HealthStatusEvent({
				state: (unhealthy == 0) ? HealthState.UP : HealthState.DOWN,
				service: "redis",
				detail: `${unhealthy} of ${total} clients have connectivity issues`,
				timestamp: Date.now()
			})
		);
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
			LOGGER.debug("Redis client for database index %i is connected and ready.", databaseIndex);
			this.eventBus.emit(new DatabaseReconnectEvent(databaseIndex));
		});

		// set authentication if available
		if (this.configService.get().storage.password) {
			client.auth(this.configService.get().storage.password);
		}

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