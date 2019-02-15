import { ConfigurationService, Configuration } from "../src/configuration";
import EventBus from "../src/core/event/event-bus";
import * as sinon from "sinon";
import SonarClient from "../src/sonar/client/sonar-client";

export class EventBusMock extends EventBus {
	constructor() {
		super();
		this.emit = sinon.stub();
		this.register = sinon.stub();
	}
}

export class ConfigurationServiceMock extends ConfigurationService {
	constructor() {
		super("./test/config.yml");
	}
}

export class SonarClientMock extends SonarClient {
	constructor(configService = new ConfigurationServiceMock(), eventBus = new EventBusMock()) {
		super(configService, eventBus);
	}
}