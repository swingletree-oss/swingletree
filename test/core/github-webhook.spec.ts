"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import GithubWebhook from "../../src/core/github/github-webhook";
import { Events, AppInstalledEvent } from "../../src/core/event/event-model";

const sandbox = sinon.createSandbox();

describe("GitHub Webhook", () => {
	let uut: GithubWebhook;

	let eventBusMock: any;
	let ghAppInstallWebhookData: any;

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

		ghAppInstallWebhookData = Object.assign({}, require("../mock/gh-install-webhook.json"));
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should send app installed event", async () => {
		uut.installationHandler("test/repo", ghAppInstallWebhookData);

		sinon.assert.calledWith(eventBusMock.emit, sinon.match((event: AppInstalledEvent) => {
				return event.getEventType() == Events.AppInstalledEvent;
			})
		);
	});

});
