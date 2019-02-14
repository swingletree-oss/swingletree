"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import { SonarClient } from "../../src/sonar/client/sonar-client";

const sandbox = sinon.createSandbox();

describe("Sonar Client", () => {
	let uut: SonarClient;

	beforeEach(function () {

		const configurationMock: any = {
			get: sinon.stub().returns({
				sonar: {
					token: "98451e669834295d248afa4a5430048bf39a619d",
					base: "http://localhost:8000"
				}
			})
		};

		const eventBusMock: any = {
			register: sinon.stub()
		};

		uut = new SonarClient(configurationMock, eventBusMock);
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should indicate paging requirement", () => {
		const paging = {
			pageIndex: 1,
			pageSize: 1,
			total: 100
		};
		chai.assert.isTrue(uut.pagingNecessary(paging));
	});

	it("should not page too much", () => {
		const paging = {
			pageIndex: 3,
			pageSize: 1,
			total: 3
		};
		chai.assert.isFalse(uut.pagingNecessary(paging));
	});

});
