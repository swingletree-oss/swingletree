"use strict";

import * as chai from "chai";
import { describe } from "mocha";
import * as sinon from "sinon";
import { mockReq, mockRes } from "sinon-express-mock";
import NebulaWebhook from "../../src/nebula/webhook";
import { ConfigurationServiceMock, EventBusMock, InstallationStorageMock } from "../mock-classes";
import { NebulaModel } from "../../src/nebula/model";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Nebula Webhook", () => {

	let uut;
	let requestMock, responseMock;
	let nebulaTestData;
	let buildData;

	beforeEach(() => {
		uut = new NebulaWebhook(
			new EventBusMock(),
			new ConfigurationServiceMock(),
			new InstallationStorageMock()
		);

		buildData = {
			eventName: "",
			payload: {
				build: JSON.stringify({
					buildId: "id",
					result: {
						status: NebulaModel.ResultValue.SUCCESS
					}
				} as NebulaModel.BuildMetrics),
				buildId: "id"
			}
		};

		requestMock = mockReq();
		responseMock = mockRes();

		requestMock.header = sinon.stub();

		nebulaTestData = Object.assign({}, require("../mock/nebula/call.json"));
	});



	["org", "repo", "sha", "branch"].forEach((prop) => {
		it(`should answer with 400 when missing ${prop} parameter`, async () => {
			requestMock.header.withArgs("X-swingletree-org").returns("org");
			requestMock.header.withArgs("X-swingletree-repo").returns("repo");
			requestMock.header.withArgs("X-swingletree-sha").returns("sha");
			requestMock.header.withArgs("X-swingletree-branch").returns("branch");

			requestMock.header.withArgs("X-swingletree-" + prop).returns(undefined);

			requestMock.body = buildData;

			await uut.webhook(requestMock, responseMock);

			sinon.assert.calledOnce(responseMock.send);
			sinon.assert.calledWith(responseMock.status, 400);
		});
	});

	it(`should answer with 400 when missing content in report body`, async () => {
		requestMock.header.withArgs("X-swingletree-org").returns("org");
		requestMock.header.withArgs("X-swingletree-repo").returns("repo");
		requestMock.header.withArgs("X-swingletree-sha").returns("sha");
		requestMock.header.withArgs("X-swingletree-branch").returns("branch");

		requestMock.body = {};

		await uut.webhook(requestMock, responseMock);

		sinon.assert.calledOnce(responseMock.send);
		sinon.assert.calledWith(responseMock.status, 400);
	});

	it(`should answer with 204 when receiving valid request`, async () => {
		requestMock.header.withArgs("X-swingletree-org").returns("org");
		requestMock.header.withArgs("X-swingletree-repo").returns("repo");
		requestMock.header.withArgs("X-swingletree-sha").returns("sha");
		requestMock.header.withArgs("X-swingletree-branch").returns("branch");

		requestMock.body = buildData;

		await uut.webhook(requestMock, responseMock);

		sinon.assert.calledOnce(responseMock.send);
		sinon.assert.calledWith(responseMock.status, 204);
	});
});
