"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import { SonarQualityGate } from "./sonar-quality-gate";

describe("Sonar Quality Gate Model", () => {
	let uut: SonarQualityGate;
	let model: any;

	beforeEach(function () {
		model = Object.assign({}, require("../../../test/base-sonar-webhook").qualityGate);
	});

	it("should calculate correct failure count", () => {
		model.conditions = [
			{ status: "FAILED" },
			{ status: "FAILED" },
			{ status: "FAILED" },
			{ status: "OK" },
			{ status: "FAILED" }
		];

		uut = new SonarQualityGate(model);

		chai.assert.equal(uut.getFailureCount(), 4);
	});

	it("should handle empty conditions array", () => {
		model.conditions = [];

		uut = new SonarQualityGate(model);

		chai.assert.equal(uut.getFailureCount(), 0);
	});

	it("should handle undefined conditions array", () => {
		model.conditions = undefined;

		uut = new SonarQualityGate(model);

		chai.assert.equal(uut.getFailureCount(), 0);
	});

});