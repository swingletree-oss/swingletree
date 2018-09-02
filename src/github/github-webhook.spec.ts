"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import GithubWebhook from "./github-webhook";
import { AppEvent } from "../app-events";
import { GithubWebhookEventType } from "./model/gh-webhook-event";

const sandbox = sinon.createSandbox();

describe("GitHub Webhook", () => {
	let uut: GithubWebhook;

	let eventBusMock: any;
	let pullRequestData: any;

	beforeEach(function () {
		eventBusMock = {
			emit: sinon.stub(),
			register: sinon.stub()
		};

		const configurationMock: any = {
			get: sinon.stub().returns({
				context: "test"
			})
		};

		uut = new GithubWebhook(eventBusMock, configurationMock);

		pullRequestData = Object.assign({}, require("../../test/ghPushEvent.json"));
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should send sendStatus pending event on GitHub push event", () => {
		uut.installationHandler(GithubWebhookEventType.INSTALLATION, "test/repo", pullRequestData);

		sinon.assert.calledWith(eventBusMock.emit, AppEvent.appInstalled);
	});

});
