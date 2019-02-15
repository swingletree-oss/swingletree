import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { SonarClientMock } from "../mock-classes";
import SonarClient from "../../src/sonar/client/sonar-client";

const sandbox = sinon.createSandbox();

const mockPort = 10101;

describe("Integration Test", () => {
	let mockServer: any;
	let sonarClient: SonarClient;

	before(() => {
		const http = require("http");

		const config = {
			get: sinon.stub().returns({
				sonar: {
					base: "http://localhost:" + mockPort
				}
			})
		};

		mockServer = http.createServer(require("mockserver")("./test/mock")).listen(mockPort);
		sonarClient = new SonarClientMock();
	});

	after(function () {
		mockServer.close();
	});


	it("should indicate paging requirement", () => {

	});

});
