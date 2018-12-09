"use strict";

import CommitStatusSender from "./commit-status-sender";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import GithubClientService from "./client/github-client";
import { Events, SonarAnalysisCompleteEvent, GithubCheckStatusUpdatedEvent, GithubCheckRunWriteEvent } from "../event/event-model";

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

		mockEvent = new GithubCheckRunWriteEvent(Object.assign({}, require("../../test/github/check-run/create.json")));
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register to SonarQube analysis complete event", () => {
		sinon.assert.calledWith(eventBusMock.register, Events.GithubCheckRunWriteEvent);
	});

	it("should send commit status on matching event", (done) => {
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