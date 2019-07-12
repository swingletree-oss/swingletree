"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { RepositorySourceConfigurable } from "../../src/core/event/event-model";
import EventConfigCache from "../../src/core/event/event-config";
import { EventBusMock, GithubClientServiceMock } from "../mock-classes";

const sandbox = sinon.createSandbox();

describe("Event Config Cache", () => {
	let uut: EventConfigCache;
	let eventBusMock;
	let githubMock: GithubClientServiceMock;

	beforeEach(function () {
		eventBusMock = new EventBusMock();
		githubMock = new GithubClientServiceMock();
		githubMock.getSwingletreeConfigFromRepository = sinon.stub().resolves({ plugin: {}});
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
			augmented: false
		};

		await uut.eventAugmentionHandler(event);

		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("augmented", true));
		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", event.eventType));
		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("config", sinon.match.has("plugin")));
	});

});
