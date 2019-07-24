"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import TwistlockWebhook from "../../src/twistlock/webhook";
import { EventBusMock, ConfigurationServiceMock, InstallationStorageMock } from "../mock-classes";
import { mockReq, mockRes } from "sinon-express-mock";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Twistlock Webhook", () => {

	let uut;
	let requestMock, responseMock;
	let twistlockTestData;

	beforeEach(() => {
		uut = new TwistlockWebhook(
			new EventBusMock(),
			new ConfigurationServiceMock(),
			new InstallationStorageMock()
		);

		requestMock = mockReq();
		responseMock = mockRes();

		twistlockTestData = Object.assign({}, require("../mock/twistlock-report-all.json"));
	});



	["org", "repo", "sha"].forEach((prop) => {
		it(`should answer with 400 when missing ${prop} parameter`, async () => {
			requestMock.query = {
				org: "org",
				repo: "repo",
				sha: "sha"
			};

			requestMock.query[prop] = undefined;

			requestMock.body = {
				site: {}
			};

			await uut.webhook(requestMock, responseMock);

			sinon.assert.calledOnce(responseMock.send);
			sinon.assert.calledWith(responseMock.status, 400);
		});
	});

	it(`should answer with 400 when missing site property in report body`, async () => {
		requestMock.query = {
			org: "org",
			repo: "repo",
			sha: "sha"
		};

		requestMock.body = {};

		await uut.webhook(requestMock, responseMock);

		sinon.assert.calledOnce(responseMock.send);
		sinon.assert.calledWith(responseMock.status, 400);
	});

	it(`should answer with 204 when receiving valid request`, async () => {
		requestMock.query = {
			org: "org",
			repo: "repo",
			sha: "sha"
		};

		requestMock.body = {
			results: [
				{}, {}
			]
		};

		await uut.webhook(requestMock, responseMock);

		sinon.assert.calledOnce(responseMock.send);
		sinon.assert.calledWith(responseMock.status, 204);
	});
});
