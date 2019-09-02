"use strict";

import * as chai from "chai";
import { expect } from "chai";
import { describe } from "mocha";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "../../src/core/template/template-engine";
import { ZapPlugin } from "../../src/zap/zap";
import { ZapReportReceivedEvent } from "../../src/zap/zap-events";
import { Zap } from "../../src/zap/zap-model";
import { Swingletree } from "../../src/core/model";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Zap Template", () => {

	let envBackup;
	let zapTestData;

	beforeEach(() => {

		envBackup = process.env;
		zapTestData = Object.assign({}, require("../mock/zap-report.json"));
	});

	afterEach(() => {
		process.env = envBackup;
	});

	describe("GitHub Check Summary", () => {
		let uut: TemplateEngine;

		beforeEach(() => {
			uut = new TemplateEngine();
			uut.addFilter("zapRiskcodeIcon", ZapPlugin.zapRiskcodeIconFilter);
			uut.addFilter("zapConfidence", ZapPlugin.zapConfidenceFilter);
		});

		it("should compile the template", () => {
			uut.template(Templates.ZAP_SCAN, undefined);
		});

		it("should run ZAP template with test data", () => {
			const counts = new Map<Zap.Riskcode, number>();
			counts.set(Zap.Riskcode.INFORMATIONAL, 4);
			counts.set(Zap.Riskcode.HIGH, 1);
			counts.set(Zap.Riskcode.LOW, 56);
			counts.set(Zap.Riskcode.MEDIUM, 1337);

			const source = new Swingletree.GithubSource();
			source.owner = "org";
			source.repo = "repo";

			const templateContent = uut.template<Zap.ReportTemplate>(Templates.ZAP_SCAN, {
				event: new ZapReportReceivedEvent(zapTestData, source),
				counts: counts
			});

			expect(templateContent).to.contain("2.7.0", "zap version is missing or has not the expected value");
			expect(templateContent).to.contain("Mon, 6 May 2019 13:28:14", "report date is missing or has not the expected value");
			expect(templateContent).to.contain("X-Frame-Options Header Not Set", "report items are missing");
		});

	});

});
