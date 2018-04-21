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
			get: sinon.stub().returns(emitMock),
			on: sinon.stub()
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


	it("should send analyzePR event on open PRs", (done) => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");

		this.uut.webhook(pullRequestData);

		sinon.assert.calledWith(emitMock, AppEvent.analyzePR);
		sinon.assert.calledWith(emitMock, AppEvent.sendStatus, sinon.match({
			id: 1337,
			merge: false
		}));

	});

	it("should send ignore event on closed PRs", (done) => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("pull_request");
		pullRequestData.body.action = "closed";

		this.uut.webhook(pullRequestData);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send delete event on 'deleted' webhook events with ref type 'branch'", (done) => {
		branchDeleteData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("delete");
		branchDeleteData.body.ref_type = "branch";

		this.uut.webhook(pullRequestData);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send ignore event on 'deleted' webhook events with ref type 'tag'", (done) => {
		branchDeleteData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("delete");
		branchDeleteData.body.ref_type = "tag";

		this.uut.webhook(pullRequestData);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send ignore event on irrelevant event type header values", (done) => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns("some_other_type");

		this.uut.webhook(pullRequestData);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});

	it("should send ignore event on missing event type header", (done) => {
		pullRequestData.header = sandbox.stub().withArgs("X-GitHub-Event").returns(undefined);

		this.uut.webhook(pullRequestData);

		sinon.assert.calledWith(emitMock, AppEvent.webhookEventIgnored, GitHubWebhook.IGNORE_ID);
	});
});
