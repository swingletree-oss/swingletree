"use strict";

import CommitStatusSender from "../../src/core/github/commit-status-sender";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import { Events, GithubCheckRunWriteEvent } from "../../src/core/event/event-model";

const sandbox = sinon.createSandbox();

describe("Commit Status Sender", () => {
	let uut: CommitStatusSender;

	let mockEvent: GithubCheckRunWriteEvent;

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

		mockEvent = new GithubCheckRunWriteEvent(Object.assign({}, require("../mock/check-run-create.json")));
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register to SonarQube analysis complete event", () => {
		sinon.assert.calledWith(eventBusMock.register, Events.GithubCheckRunWriteEvent);
	});

	it("should send commit status on matching event", (done: any) => {
		githubClientMock.createCheckStatus.resolves();

		uut.sendAnalysisStatus(mockEvent)
			.then(() => {
				sinon.assert.calledWith(eventBusMock.emit,
					sinon.match.has("eventType", Events.GithubCheckStatusUpdatedEvent)
				);
				done();
			})
			.catch(done);
	});

});