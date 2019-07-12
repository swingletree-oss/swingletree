import { ConfigurationService } from "../src/configuration";
import EventBus from "../src/core/event/event-bus";
import * as sinon from "sinon";
import SonarClient from "../src/sonar/client/sonar-client";
import InstallationStorage from "../src/core/github/client/installation-storage";
import RedisClientFactory from "../src/core/db/redis-client";
import { TemplateEngine } from "../src/core/template/template-engine";
import TokenStorage from "../src/core/github/client/token-storage";
import { SonarConfig } from "../src/sonar/sonar-config";
import { CoreConfig } from "../src/core/core-config";
import GithubClientService from "../src/core/github/client/github-client";
import EventConfigCache from "../src/core/event/event-config";

export class EventBusMock extends EventBus {
	constructor() {
		super();
		this.emit = sinon.stub();
		this.register = sinon.stub();
	}
}

export class EventConfigCacheMock extends EventConfigCache {
	constructor() {
		super(new GithubClientServiceMock(), new EventBusMock());

		const self: any = this;
		self.github = new GithubClientServiceMock();
	}
}

export class GithubClientServiceMock extends GithubClientService {
	constructor() {
		super(new ConfigurationServiceMock(), new TokenStorageMock(), new InstallationStorageMock);

		this.getSwingletreeConfigFromRepository = sinon.stub().resolves()

		const self: any = this;
		self.retrieveBearerToken = sinon.stub().resolves("testBearer");
	}
}

export class ConfigurationServiceMock extends ConfigurationService {
	constructor() {
		super();
		const configStub = sinon.stub();
		configStub.withArgs(SonarConfig.BASE).returns("http://localhost:10101");
		configStub.withArgs(CoreConfig.Github.KEYFILE).returns("./test/app-key.test");
		configStub.withArgs(CoreConfig.Github.BASE).returns("http://localhost:10101");
		this.get = configStub;
	}
}

export class SonarClientMock extends SonarClient {
	constructor(configService = new ConfigurationServiceMock(), eventBus = new EventBusMock()) {
		super(configService, eventBus);
	}
}

export class RedisClientFactoryMock extends RedisClientFactory {
	constructor() {
		super(new ConfigurationServiceMock(), new EventBusMock());
		this.createClient = sinon.stub();
		this.connectionCount = sinon.stub().returns(2);
		this.unhealthyConnectionCount = sinon.stub().returns(0);
	}
}

export class InstallationStorageMock extends InstallationStorage {
	constructor() {
		super(new RedisClientFactoryMock());
		this.getInstallationId = sinon.stub().resolves(10);
		this.isSyncRequired = sinon.stub().resolves(false);
		this.removeSyncFlag = sinon.stub();
		this.store = sinon.stub();
	}
}

export class TokenStorageMock extends TokenStorage {
	constructor() {
		super(new RedisClientFactoryMock());

		this.getToken = sinon.stub().resolves(null);
		this.store = sinon.stub();
	}
}

export class TemplateEngineMock extends TemplateEngine {
	constructor() {
		super();

		this.addFilter = sinon.stub();
		this.template = sinon.stub().returns("stubbed template text");
	}
}

