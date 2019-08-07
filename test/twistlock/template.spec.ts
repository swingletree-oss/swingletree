"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));
chai.use(require("chai-things"));

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
			const findingReport = new TwistlockModel.util.FindingReport(
				testData,
				TwistlockModel.FindingSeverity.LOW,
				0,
				TwistlockModel.FindingSeverity.LOW
			);

			const templateContent = uut.template<TwistlockModel.Template>(Templates.TWISTLOCK_SCAN, {
				report: testData,
				issues: findingReport
			});

			expect(templateContent).to.contain("CVE-2019-5827", "expected CVE is missing");
		});

		it("should place vulnerability exceptions into dedicated value containers", () => {
			const exceptions = new Map<string, string>();
			exceptions.set("CVE-2019-5827", "is not exploitable");

			const findingReport = new TwistlockModel.util.FindingReport(
				testData,
				TwistlockModel.FindingSeverity.LOW,
				0,
				TwistlockModel.FindingSeverity.LOW,
				exceptions
			);

			expect(findingReport.vulnerabilityIssues).to.not.contain.something.with.property("id", "CVE-2019-5827");
			expect(findingReport.ignoredVulnerabilityIssues).to.contain.something.with.property("id", "CVE-2019-5827");
		});

		it("should show vulnerability whitelists in report template", () => {
			const exceptions = new Map<string, string>();
			exceptions.set("CVE-2019-5827", "is not exploitable");

			const findingReport = new TwistlockModel.util.FindingReport(
				testData,
				TwistlockModel.FindingSeverity.LOW,
				0,
				TwistlockModel.FindingSeverity.LOW,
				exceptions
			);

			const templateContent = uut.template<TwistlockModel.Template>(Templates.TWISTLOCK_SCAN, {
				report: testData,
				issues: findingReport
			});

			expect(templateContent).to.contain("CVE-2019-5827");
			expect(templateContent).to.contain("is not exploitable");
			expect(templateContent).to.contain("Ignored Vulnerabilities");
		});

	});
});