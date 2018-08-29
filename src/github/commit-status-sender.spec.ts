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
import { GithubPushWebhookEvent } from "./model/gh-webhook-event";

const sandbox = sinon.sandbox.create();

describe("Commit Status Sender", () => {
	let uut: CommitStatusSender;

	let mockEvent: SonarWebhookEvent;
	let mockPushEvent: GithubPushWebhookEvent;

	let eventBusMock: any;
	let configurationMock: any;
	let githubClientMock: any;
	let githubMockConfig: any;

	beforeEach(function () {

		githubMockConfig = {
			pendingCommitStatus: true
		};

		eventBusMock = {
			emit: sinon.stub(),
			register: sinon.stub()
		};

		configurationMock = {
			get: sinon.stub().returns({
				context: "test",
				github: githubMockConfig
			})
		};

		githubClientMock = {
			createCheckStatus: sinon.stub()
		};

		uut = new CommitStatusSender(
			eventBusMock,
			configurationMock,
			githubClientMock
		);

		mockEvent = new SonarWebhookEvent(Object.assign({}, require("../../test/base-sonar-webhook.json")));
		mockPushEvent = new GithubPushWebhookEvent({
			repository: {
				full_name: "test/test-repo"
			},
			ref: "test",
			head_commit: {
				id: "00000"
			}
		});
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register to SonarQube analysis complete event", () => {
		sinon.assert.calledWith(eventBusMock.register, AppEvent.sonarAnalysisComplete);
	});

	it("should not register to github push events if pendingCommitStatus should be ignored", () => {
		eventBusMock.register.reset();

		githubMockConfig.pendingCommitStatus = false;

		uut = new CommitStatusSender(
			eventBusMock,
			configurationMock,
			githubClientMock
		);
		sinon.assert.neverCalledWith(eventBusMock.register, AppEvent.githubPushEvent);
	});

	it("should send pending commit status on matching event", (done) => {
		githubClientMock.createCheckStatus.resolves();

		uut.sendAnalysisStatus(mockEvent)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit, AppEvent.statusSent);
				done();
			})
			.catch(done);
	});

	it("should send commit status on matching event", (done) => {
		githubClientMock.createCheckStatus.resolves();

		uut.sendAnalysisStatus(mockEvent)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit, AppEvent.statusSent);
				done();
			})
			.catch(done);
	});

	it("should send failure commit status when quality gate failed", (done) => {
		const qualityGate = new SonarQualityGate();
		mockEvent = new SonarWebhookEvent(Object.assign({}, require("../../test/base-sonar-webhook-failed.json")));

		githubClientMock.createCheckStatus.resolves();
		uut.sendAnalysisStatus(mockEvent)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit, AppEvent.statusSent,
					sinon.match.has("conclusion", "action_required"));
				done();
			})
			.catch((err) => {
				done(err);
			});
	});

});