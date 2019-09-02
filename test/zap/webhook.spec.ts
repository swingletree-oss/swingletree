"use strict";

import * as chai from "chai";
import { describe } from "mocha";
import * as sinon from "sinon";
import { mockReq, mockRes } from "sinon-express-mock";
import ZapWebhook from "../../src/zap/zap-webhook";
import { ConfigurationServiceMock, EventBusMock, InstallationStorageMock } from "../mock-classes";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Zap Webhook", () => {

	let uut;
	let requestMock, responseMock;
	let zapTestData;

	beforeEach(() => {
		uut = new ZapWebhook(
			new EventBusMock(),
			new ConfigurationServiceMock(),
			new InstallationStorageMock()
		);

		requestMock = mockReq();
		responseMock = mockRes();

		zapTestData = Object.assign({}, require("../mock/zap-report.json"));
	});



	["org", "repo", "sha", "branch"].forEach((prop) => {
		it(`should answer with 400 when missing ${prop} parameter`, async () => {
			requestMock.query = {
				org: "org",
				repo: "repo",
				sha: "sha",
				branch: "branch"
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
			sha: "sha",
			branch: "branch"
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
			sha: "sha",
			branch: "branch"
		};

		requestMock.body = {
			site: {}
		};

		await uut.webhook(requestMock, responseMock);

		sinon.assert.calledOnce(responseMock.send);
		sinon.assert.calledWith(responseMock.status, 204);
	});
});
