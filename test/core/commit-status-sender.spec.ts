"use strict";

import CommitStatusSender from "../../src/core/github/commit-status-sender";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import { Events, NotificationEvent } from "../../src/core/event/event-model";
import { Swingletree } from "../../src/core/model";

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

		const source = new Swingletree.GithubSource();
		source.owner = "test";
		source.repo = "testRepo";
		source.sha = "sha123";

		mockEvent = new NotificationEvent({
			markdown: "123",
			sender: "testSender",
			source: source,
			title: "test title",
			annotations: []
		});
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

	it("should not set an empty annotation array in the CheckRun request", async () => {
		githubClientMock.createCheckStatus.resolves();

		const result = await uut.sendAnalysisStatus(mockEvent);

		expect(result.output.annotations).to.be.undefined;
	});


	it("should convert swingletree severities", () => {
		const conversionMap = new Map<Swingletree.Severity, String>();

		conversionMap.set(Swingletree.Severity.BLOCKER, "failure");
		conversionMap.set(Swingletree.Severity.MAJOR, "warning");
		conversionMap.set(Swingletree.Severity.WARNING, "warning");
		conversionMap.set(Swingletree.Severity.INFO, "notice");

		conversionMap.forEach((value, key) => {
			expect((uut as any).convertSwingletreeSeverity(key)).to.be.equal(value, `${key} should convert to ${value}`);
		});
	});

	it("should convert swingletree conclusions", () => {
		const conversionMap = new Map<Swingletree.Conclusion, String>();

		conversionMap.set(Swingletree.Conclusion.ANALYSIS_FAILURE, "failure");
		conversionMap.set(Swingletree.Conclusion.BLOCKED, "action_required");
		conversionMap.set(Swingletree.Conclusion.PASSED, "success");
		conversionMap.set(Swingletree.Conclusion.UNDECISIVE, "neutral");

		conversionMap.forEach((value, key) => {
			expect((uut as any).convertToConclusion(key)).to.be.equal(value, `${key} should convert to ${value}`);
		});
	});

});