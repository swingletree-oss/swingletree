"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../app-events";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { GitHubGhCommitStatusContainer } from "../github/model/gh-commit-status";

import SonarWebhook from "./sonar-webhook";
import { EventEmitter } from "events";

import EventBus from "../event-bus";
import ConfigurationService from "../configuration";

describe("Sonar Webhook", () => {

	let uut: SonarWebhook;
	let testData: any;
	let eventBusMock: any;
	let emitMock: any;

	beforeEach(function () {
		emitMock = sinon.stub();

		const configurationMock: any = {
			get: sinon.stub().returns({
				context: "test"
			})
		};

		eventBusMock = {
			get: sinon.stub().returns({ emit: emitMock, on: sinon.stub() })
		};

		testData = Object.assign({}, require("../../test/base-sonar-webhook.json"));

		uut = new SonarWebhook(
			eventBusMock as EventBus,
			configurationMock as ConfigurationService
		);
	});


	it("should send commit status event on relevant hook", () => {

		testData.properties = {
			"sonar.analysis.ghPrGate": "respond",
			"sonar.analysis.branch": "testBranch",
			"sonar.analysis.commitId": "12345",
			"sonar.analysis.repository": "testOrg/testRepo"
		};

		uut.webhook({ body: testData } as Request, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.sendStatus, sinon.match({
			commitId: "12345",
			repository: "testOrg/testRepo"
		}));
	});

	it("should send ignored event on missing properties", () => {
		uut.webhook({ body: testData } as Request, undefined);
		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
	});

	it("should not send ignored event on partially set properties", () => {
		testData.properties = {
			"sonar.analysis.branch": "testBranch",
			"sonar.analysis.commitId": "12345"
		};

		uut.webhook({ body: testData } as Request, undefined);
		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
	});
});
