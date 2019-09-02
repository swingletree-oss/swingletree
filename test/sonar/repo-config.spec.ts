"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { RepositorySourceConfigurable } from "../../src/core/event/event-model";
import EventConfigCache from "../../src/core/event/event-config";
import { EventBusMock, GithubClientServiceMock } from "../mock-classes";
import { SonarConfig } from "../../src/sonar/sonar-config";
import { SonarAnalysisCompleteEvent, SonarEvents } from "../../src/sonar/events";

import * as yaml from "js-yaml";
import * as fs from "fs";
import { SonarWebhookEvent } from "../../src/sonar/client/sonar-wehook-event";
import { Swingletree } from "../../src/core/model";

const sandbox = sinon.createSandbox();

describe("Sonar Repository Config", () => {
	let uut: EventConfigCache;
	let eventBusMock;
	let githubMock: GithubClientServiceMock;

	const pluginConfig = yaml.safeLoad(fs.readFileSync("test/mock/config/repo/sonar.yml", "utf-8"));
	const analysisEvent: SonarWebhookEvent = {
		analysedAt: "",
		changedAt: "",
		project: {
			key: "test",
			name: "name"
		},
		properties: null,
		qualityGate: null,
		serverUrl: null,
		status: null,
		taskId: null
	};

	beforeEach(function () {
		eventBusMock = new EventBusMock();
		githubMock = new GithubClientServiceMock();
		githubMock.getSwingletreeConfigFromRepository = sinon.stub().resolves(pluginConfig);
		uut = new EventConfigCache(githubMock, eventBusMock);
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should read sonar repository configuration", async () => {
		const source = new Swingletree.GithubSource();
		source.owner = "testOwner";
		source.repo = "testRepo";

		const event = new SonarAnalysisCompleteEvent(analysisEvent, source);

		await uut.eventAugmentionHandler(event);

		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("augmented", true));
		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", SonarEvents.SonarAnalysisComplete));
		sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("config", sinon.match.has("plugin")));

		expect(event.getPluginConfig("sonar")).to.have.property("enabled", true);
		expect(event.getPluginConfig("sonar")).to.have.property("blockCoverageLoss", true);
	});

});
