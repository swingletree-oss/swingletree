"use strict";

import { GithubCommitStatus, GithubCommitStatusContainer, CommitStatusEnum } from "./model/gh-commit-status";
import CommitStatusSender from "./commit-status-sender";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import GithubClientService from "./client/github-client";
import { AppEvent } from "../app-events";
import EventBus from "../event-bus";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { SonarQualityGate } from "../sonar/model/sonar-quality-gate";

const sandbox = sinon.sandbox.create();

describe("Commit Status Sender", () => {
	let uut: CommitStatusSender;

	let mockEvent: SonarWebhookEvent;

	let eventBusMock: any;
	let configurationMock: any;
	let githubClientMock: any;

	beforeEach(function () {

		eventBusMock = {
			emit: sinon.stub(),
			register: sinon.stub()
		};

		configurationMock = {
			get: sinon.stub().returns({
				context: "test"
			})
		};

		githubClientMock = {
			createCommitStatus: sinon.stub()
		};

		uut = new CommitStatusSender(
			eventBusMock,
			configurationMock,
			githubClientMock
		);

		mockEvent = new SonarWebhookEvent(Object.assign({}, require("../../test/base-sonar-webhook.json")));
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register to SonarQube analysis complete event", () => {
		sinon.assert.calledWith(eventBusMock.register, AppEvent.sonarAnalysisComplete);
	});

	it("should send commit status on matching event", (done) => {
		githubClientMock.createCommitStatus.resolves();

		uut.sendStatus(mockEvent)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit, AppEvent.statusSent);
				done();
			})
			.catch(done);
	});

	it("should send failure commit status when quality gate failed", (done) => {
		const qualityGate = new SonarQualityGate();
		mockEvent = new SonarWebhookEvent(Object.assign({}, require("../../test/base-sonar-webhook-failed.json")));

		githubClientMock.createCommitStatus.resolves();
		uut.sendStatus(mockEvent)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit, AppEvent.statusSent,
					sinon.match.has("payload", sinon.match.has("description", "Quality gate failed with 1 violations."))
						.and(sinon.match.has("payload", sinon.match.has("state", "failure"))));
				done();
			})
			.catch((err) => {
				done(err);
			});
	});

});