"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { Response, Request, NextFunction } from "express";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";

import SonarWebhook from "./sonar-webhook";
import { EventEmitter } from "events";

import EventBus from "../event/event-bus";
import { ConfigurationService } from "../configuration";
import { Events, SonarAnalysisCompleteEvent } from "../event/event-model";

describe("Sonar Webhook", () => {

	let uut: SonarWebhook;
	let testData: any;
	let eventBusMock: any;
	let responseMock: any;

	beforeEach(function () {

		const configurationMock: any = {
			get: sinon.stub().returns({
				context: "test",
				sonar: {
					logWebhookEvents: false
				}
			})
		};

		responseMock = {sendStatus: sinon.stub()};

		eventBusMock = {
			emit: sinon.stub(),
			register: sinon.stub()
		};

		testData = Object.assign({}, require("../../test/base-sonar-webhook.json"));
		// reset test data properties for test cases
		testData.properties = {};

		uut = new SonarWebhook(
			eventBusMock as EventBus,
			configurationMock as ConfigurationService
		);
	});


	it("should send commit status event on relevant hook", () => {

		testData.properties = {
			"sonar.analysis.commitId": "12345",
			"sonar.analysis.repository": "testOrg/testRepo"
		};

		uut.webhook({ body: testData } as Request, responseMock);

		sinon.assert.calledWith(eventBusMock.emit, sinon.match((val: SonarAnalysisCompleteEvent) => {
			return val.analysisEvent.properties.commitId == "12345" && val.analysisEvent.properties.repository == "testOrg/testRepo";
		}));
	});

});
