"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";

chai.use(require("sinon-chai"));

import { AppEvent } from "../app-events";
import EventBus from "../event-bus";

import GhAppInstallationHandler from "./app-installation-handler";
import { GithubWebhookEventType } from "./model/gh-webhook-event";

const sandbox = sinon.sandbox.create();

describe("App installation handler", () => {
	let uut: GhAppInstallationHandler;

	let eventBusMock: any;
	let installationStorage: any;

	beforeEach(function () {

		eventBusMock = {
			register: sinon.stub()
		};

		installationStorage = {
			store: sinon.stub()
		};

		uut = new GhAppInstallationHandler(
			eventBusMock,
			installationStorage
		);
	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should register on installation event", () => {
		sinon.assert.calledWith(eventBusMock.register, AppEvent.appInstalled);
	});

	it("should store installation metadata", () => {
		uut.appInstalled({
			login: "login",
			applicationId: 321,
			eventType: GithubWebhookEventType.INSTALLATION,
			installationId: 123
		});

		sinon.assert.calledWith(installationStorage.store, "login", 123);
	});

});