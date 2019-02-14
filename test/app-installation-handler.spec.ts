"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));

import GhAppInstallationHandler from "../src/core/github/app-installation-handler";
import { GithubWebhookEventType } from "../src/core/github/model/gh-webhook-event";
import { AppInstalledEvent, Events } from "../src/core/event/event-model";

const sandbox = sinon.createSandbox();

describe("App installation handler", () => {
	let uut: GhAppInstallationHandler;

	let eventBusMock: any;
	let installationStorage: any;
	let githubClientMock: any;

	beforeEach(function () {

		eventBusMock = {
			register: sinon.stub()
		};

		installationStorage = {
			store: sinon.stub()
		};

		githubClientMock = {
			getInstallations: sinon.stub().resolves([
				{
					account: { login: "test" },
					id: "testId"
				}
			])
		};

		uut = new GhAppInstallationHandler(
			eventBusMock,
			installationStorage,
			githubClientMock
		);
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register on installation event", () => {
		sinon.assert.calledWith(eventBusMock.register, Events.AppInstalledEvent);
	});

	it("should store installation metadata", () => {
		const data = {
			account: {
				login: "login"
			},
			app_id: 321,
			id: 123
		};

		uut.appInstalled({
			installationId: data.id,
			login: data.account.login
		} as AppInstalledEvent);

		sinon.assert.calledWith(installationStorage.store, "login", 123);
	});

});