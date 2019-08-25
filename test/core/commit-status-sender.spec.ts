"use strict";

import CommitStatusSender from "../../src/core/github/commit-status-sender";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import { Events, NotificationEvent } from "../../src/core/event/event-model";

const sandbox = sinon.createSandbox();

describe("Commit Status Sender", () => {
	let uut: CommitStatusSender;

	let mockEvent: NotificationEvent;

	let eventBusMock: any;
	let configurationMock: any;
	let githubClientMock: any;
	let githubMockConfig: any;
	let sonarClientMock: any;
	let templateEngineMock: any;

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

		templateEngineMock = {
			template: sinon.stub().returns("mocked template")
		};

		sonarClientMock = {
			getIssues: sinon.stub()
		};

		githubClientMock = {
			createCheckStatus: sinon.stub(),
			isOrganizationKnown: sinon.stub().resolves(true)
		};

		uut = new CommitStatusSender(
			eventBusMock,
			githubClientMock
		);

		mockEvent = new NotificationEvent({
			org: "test",
			repo: "testRepo",
			markdown: "123",
			sender: "testSender",
			sha: "sha123",
			title: "test title"
		})
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register to SonarQube analysis complete event", () => {
		sinon.assert.calledWith(eventBusMock.register, Events.NotificationEvent);
	});

	it("should send commit status on matching event", async () => {
		githubClientMock.createCheckStatus.resolves();

		await uut.sendAnalysisStatus(mockEvent);

		sinon.assert.calledOnce(githubClientMock.createCheckStatus);
	});

});