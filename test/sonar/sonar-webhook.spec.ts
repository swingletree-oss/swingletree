"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { Response, Request, NextFunction } from "express";

import SonarWebhook from "../../src/sonar/sonar-webhook";
import { EventEmitter } from "events";

import EventBus from "../../src/core/event/event-bus";
import { ConfigurationService } from "../../src/configuration";
import { ConfigurationServiceMock, EventBusMock, InstallationStorageMock } from "../mock-classes";

describe("Sonar Webhook", () => {

	let uut: SonarWebhook;
	let testData: any;
	let eventBusMock: any;
	let responseMock: any;

	beforeEach(function () {

		const configurationMock = new ConfigurationServiceMock();
		configurationMock.get = sinon.stub().returns({
			context: "test",
			sonar: {
				logWebhookEvents: false
			}
		});

		responseMock = {sendStatus: sinon.stub()};

		eventBusMock = new EventBusMock();

		testData = Object.assign({}, require("../mock/base-sonar-webhook.json"));
		// reset test data properties for test cases
		testData.properties = {};

		uut = new SonarWebhook(
			eventBusMock as EventBus,
			configurationMock as ConfigurationService,
			new InstallationStorageMock()
		);
	});


	it("should send commit status event on relevant hook", async () => {

		testData.properties = {
			"sonar.analysis.commitId": "12345",
			"sonar.analysis.repository": "testOrg/testRepo"
		};

		await uut.webhook({ body: testData } as Request, responseMock);

		sinon.assert.calledWith(eventBusMock.emit, sinon.match.hasNested("source.sha", "12345"));
		sinon.assert.calledWith(eventBusMock.emit, sinon.match.hasNested("source.owner", "testOrg"));
		sinon.assert.calledWith(eventBusMock.emit, sinon.match.hasNested("source.repo", "testRepo"));
	});

});
