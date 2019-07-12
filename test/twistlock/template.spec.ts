"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import { TemplateEngine, Templates } from "../../src/core/template/template-engine";
import { TwistlockModel } from "../../src/twistlock/model";


const sandbox = sinon.createSandbox();

describe("Twistlock Template", () => {

	let testData;

	beforeEach(() => {
		testData = Object.assign({}, require("../mock/twistlock-report-all.json"));
	});

	afterEach(() => {
	});

	describe("Scan Template", () => {
		let uut: TemplateEngine;

		beforeEach(() => {
			uut = new TemplateEngine();
		});

		it("should compile the template", () => {
			uut.template(Templates.TWISTLOCK_SCAN, undefined);
		});

		it("should run ZAP template with test data", () => {
			const templateContent = uut.template<TwistlockModel.Template>(Templates.TWISTLOCK_SCAN, {
				report: testData
			});

			expect(templateContent).to.contain("CVE-2019-5827", "expected CVE is missing");
		});

	});
});