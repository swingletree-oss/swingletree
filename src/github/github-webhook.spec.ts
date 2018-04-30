"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import GithubWebhook from "./github-webhook";
import { AppEvent } from "../app-events";
import EventBus from "../event-bus";
import { ConfigurationService } from "../configuration";
import { GithubWebhookEventType } from "./model/gh-webhook-event";


const sandbox = sinon.createSandbox();

describe("GitHub Webhook", () => {
	let uut: GithubWebhook;

	let eventBusMock: any;
	let pullRequestData: any;
	let branchDeleteData: any;
	let responseMock: any;

	beforeEach(function () {
		eventBusMock = {
			emit: sinon.stub(),
			register: sinon.stub()
		};

		responseMock = {sendStatus: sinon.stub()};

		const configurationMock: any = {
			get: sinon.stub().returns({
				context: "test"
			})
		};

		uut = new GithubWebhook(eventBusMock, configurationMock);

		pullRequestData = Object.assign({}, require("../../test/ghPullRequestEvent.json"));

		branchDeleteData = { body: Object.assign({}, require("../../test/ghDeleteEvent.json")) };
		branchDeleteData.header = function () {};
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should send analyzePR event on open PRs", () => {
		uut.ghEventHandler(GithubWebhookEventType.PULL_REQUEST, "test/repo", pullRequestData);

		sinon.assert.calledWith(eventBusMock.emit, AppEvent.analyzePR);
	});

	it("should send sendStatus pending event on open PRs", () => {
		uut.ghEventHandler(GithubWebhookEventType.PULL_REQUEST, "test/repo", pullRequestData);

		sinon.assert.calledWith(eventBusMock.emit, AppEvent.sendStatus, sinon.match({
			state: "pending"
		}));
	});

	it("should ignore event on closed PRs", () => {
		pullRequestData.action = "closed";

		uut.ghEventHandler(GithubWebhookEventType.PULL_REQUEST, "test/repo", pullRequestData);

		sinon.assert.neverCalledWith(eventBusMock.emit, AppEvent.sendStatus, sinon.match.any);
	});

});
