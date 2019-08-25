"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { RepositorySourceConfigurable, RepositoryConfig } from "../../src/core/event/event-model";
import EventConfigCache from "../../src/core/event/event-config";
import { EventBusMock, GithubClientServiceMock } from "../mock-classes";

const sandbox = sinon.createSandbox();

describe("Event Config Cache", () => {
	let uut: EventConfigCache;
	let eventBusMock;
	let githubMock: GithubClientServiceMock;
	const testConfig: any = { plugin: { sonar: {}}};

	beforeEach(function () {
		eventBusMock = new EventBusMock();
		githubMock = new GithubClientServiceMock();
		githubMock.getSwingletreeConfigFromRepository = sinon.stub().resolves(testConfig);
		uut = new EventConfigCache(githubMock, eventBusMock);
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should react on augmentation events", async () => {
		const event: RepositorySourceConfigurable = {
			id: "testId",
			owner: "org",
			repo: "repo",
			eventType: "testType",
			getEventType: sinon.stub(),
			augmented: false,
			getPluginConfig: sinon.stub()
		};

		await uut.eventAugmentionHandler(event);

		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("augmented", true));
		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", event.eventType));
		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("config", sinon.match.has("plugin")));
	});

	it("should retrieve configs from cache", async () => {
		await uut.get("test", "testRepo");
		await uut.get("test", "testRepo");
		const value: RepositoryConfig = await uut.get("test", "testRepo");

		sinon.assert.calledOnce(githubMock.getSwingletreeConfigFromRepository as any);
		expect(value.plugin.get).to.be.not.undefined;
		expect(value.plugin.get("sonar")).to.be.not.undefined;
	});

});
