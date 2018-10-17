"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import GithubWebhook from "./github-webhook";
import { GithubWebhookEventType } from "./model/gh-webhook-event";
import { Events, AppInstalledEvent } from "../event/event-model";

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

		ghAppInstallWebhookData = Object.assign({}, require("../../test/github/gh-install-webhook.json"));
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should send app installed event", () => {
		uut.installationHandler("test/repo", ghAppInstallWebhookData);

		sinon.assert.calledWith(eventBusMock.emit, sinon.match((event: AppInstalledEvent) => {
				return event.getEventType() == Events.AppInstalledEvent;
			})
		);
	});

});
