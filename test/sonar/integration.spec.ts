"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import SonarClient from "../../src/sonar/client/sonar-client";
import { SonarClientMock } from "../mock-classes";
import { SonarMetrics } from "../../src/sonar/model/sonar-issue";

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

		mockServer = http.createServer(require("mockserver")("./test/mock", true)).listen(mockPort);
		sonarClient = new SonarClientMock();
	});

	after(function () {
		mockServer.close();
	});


	describe("Sonar Client", () => {
		it("should indicate paging requirement", async () => {
			expect(await sonarClient.getVersion()).to.equal("1.2.3-TEST");
		});

		it("should retrieve single measures", async () => {
			expect(
				await sonarClient.getMeasureValue("test", SonarMetrics.NEW_COVERAGE)
			).to.equal("90.0");
		});

		it("should retrieve multiple measures", async () => {
			const result = await sonarClient.getMeasures("test", [ SonarMetrics.NEW_COVERAGE, SonarMetrics.NEW_VIOLATIONS ]);

			expect(result.measures.get(SonarMetrics.NEW_COVERAGE).value).to.equal("90.0");
			expect(result.measures.get(SonarMetrics.NEW_VIOLATIONS).value).to.equal("1");
		});
	});

});
