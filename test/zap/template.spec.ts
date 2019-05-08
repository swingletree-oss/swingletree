"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "../../src/core/template/template-engine";
import { ZapPlugin } from "../../src/zap/zap";
import { Sonar } from "../../src/sonar/client/sonar-issue";
import { SonarCheckRunSummaryTemplate } from "../../src/sonar/sonar-template";
import { Zap } from "../../src/zap/zap-model";
import { ZapReportReceivedEvent } from "../../src/zap/zap-events";

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

			uut.template<Zap.ReportTemplate>(Templates.ZAP_SCAN, {
				event: new ZapReportReceivedEvent(zapTestData),
				counts: counts
			});
		});

	});

});
