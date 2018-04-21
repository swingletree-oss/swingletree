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
			get: sinon.stub().returns(emitMock),
			on: sinon.stub()
		};

		testData = Object.assign({}, require("../../test/base-sonar-webhook.json"));

		uut = new SonarWebhook(
			eventBusMock,
			configurationMock
		);
	});


	it("should send commit status event on relevant hook", () => {

		testData.properties = {
			"sonar.analysis.ghPrGate": "respond",
			"sonar.analysis.branch": "testBranch",
			"sonar.analysis.commitId": "12345",
			"sonar.analysis.repository": "testOrg/testRepo"
		};

		this.uut.webhook({ body: testData });

		sinon.assert.calledWith(emitMock, AppEvent.sendStatus, sinon.match({
			commitId: "12345",
			repository: "testOrg/testRepo",
			context: "test"
		}));
	});

	it("should send ignored event on missing properties", (done) => {
		this.uut.webhook({ body: testData });
		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
	});

	it("should not send ignored event on partially set properties", (done) => {
		testData.properties = {
			"sonar.analysis.branch": "testBranch",
			"sonar.analysis.commitId": "12345"
		};

		this.uut.webhook({ body: testData });
		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, SonarWebhook.IGNORE_ID);
	});
});
