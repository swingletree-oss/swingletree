"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "../src/core/template/template-engine";
import { SonarQubePlugin } from "../src/sonar/sonar";
import { RuleType } from "../src/sonar/model/sonar-issue";
import { SonarCheckRunSummaryTemplate } from "../src/sonar/sonar-template";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Template Engine", () => {

	let envBackup;
	let sonarWebhookTestData;

	beforeEach(() => {

		envBackup = process.env;
		sonarWebhookTestData = Object.assign({}, require("./mock/base-sonar-webhook.json"));
	});

	afterEach(() => {
		process.env = envBackup;
	});

	describe("GitHub Check Summary", () => {
		let uut: TemplateEngine;

		it("should compile the template", () => {
			uut = new TemplateEngine();

			uut.addFilter("ruleTypeIcon", SonarQubePlugin.ruleTypeIconFilter);
			uut.template(Templates.CHECK_RUN_SUMMARY, undefined);
		});

		it("should run template with test data", () => {
			uut = new TemplateEngine();

			uut.addFilter("ruleTypeIcon", SonarQubePlugin.ruleTypeIconFilter);
			const counts = new Map<string, number>();
			counts.set(RuleType.BUG, 20);
			counts.set(RuleType.CODE_SMELL, 30);
			counts.set(RuleType.SECURITY_HOTSPOT, 40);
			counts.set(RuleType.VULNERABILITY, 100);

				uut.template<SonarCheckRunSummaryTemplate>(Templates.CHECK_RUN_SUMMARY, {
				event: sonarWebhookTestData,
				branchCoverage: 100,
				targetCoverage: 80,
				annotationsCapped: true,
				issueCounts: counts,
				totalIssues: 1335
			});
		});

	});

});
