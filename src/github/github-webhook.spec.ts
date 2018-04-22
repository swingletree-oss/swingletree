"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import GitHubWebhook from "./github-webhook";
import { AppEvent } from "../app-events";
import EventBus from "../event-bus";
import { emit } from "cluster";


const sandbox = sinon.createSandbox();

describe("GitHub Webhook", () => {
	let uut: GitHubWebhook;

	let eventBusMock: any;
	let emitMock: any;
	let pullRequestData: any;
	let branchDeleteData: any;

	beforeEach(function () {
		emitMock = sinon.stub();

		eventBusMock = {
			get: sinon.stub().returns({ emit: emitMock, on: sinon.stub() })
		};

		uut = new GitHubWebhook(eventBusMock);

		pullRequestData = { body: Object.assign({}, require("../../test/ghPullRequestEvent.json")) };
		pullRequestData.header = function () {};

		branchDeleteData = { body: Object.assign({}, require("../../test/ghDeleteEvent.json")) };
		branchDeleteData.header = function () {};
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should send analyzePR event on open PRs", () => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.analyzePR);
	});

	it("should send sendStatus pending event on open PRs", () => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.sendStatus, sinon.match({
			state: "pending"
		}));
	});

	it("should send ignore event on closed PRs", () => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
		pullRequestData.body.action = "closed";

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send delete event on 'deleted' webhook events with ref type 'branch'", () => {
		branchDeleteData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("delete");
		branchDeleteData.body.ref_type = "branch";

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send ignore event on 'deleted' webhook events with ref type 'tag'", () => {
		branchDeleteData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("delete");
		branchDeleteData.body.ref_type = "tag";

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send ignore event on irrelevant event type header values", () => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("some_other_type");

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send ignore event on missing event type header", () => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns(undefined);

		uut.webhook(pullRequestData, undefined);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});
});
