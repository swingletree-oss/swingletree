"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "../../src/core/template/template-engine";
import { SonarQubePlugin } from "../../src/sonar/sonar";
import { Sonar } from "../../src/sonar/client/sonar-issue";
import { SonarCheckRunSummaryTemplate } from "../../src/sonar/sonar-template";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Template Engine", () => {

	let envBackup;
	let sonarWebhookTestData;

	beforeEach(() => {

		envBackup = process.env;
		sonarWebhookTestData = Object.assign({}, require("../mock/base-sonar-webhook.json"));
	});

	afterEach(() => {
		process.env = envBackup;
	});

	describe("GitHub Check Summary", () => {
		let uut: TemplateEngine;

		beforeEach(() => {
			uut = new TemplateEngine();
			uut.addFilter("ruleTypeIcon", SonarQubePlugin.ruleTypeIconFilter);
		});

		it("should compile the template", () => {
			uut.template(Templates.CHECK_RUN_SUMMARY, undefined);
		});

		it("should run template with test data", () => {
			const counts = new Map<string, number>();
			counts.set(Sonar.model.RuleType.BUG, 20);
			counts.set(Sonar.model.RuleType.CODE_SMELL, 30);
			counts.set(Sonar.model.RuleType.SECURITY_HOTSPOT, 40);
			counts.set(Sonar.model.RuleType.VULNERABILITY, 100);

			uut.template<SonarCheckRunSummaryTemplate>(Templates.CHECK_RUN_SUMMARY, {
				event: sonarWebhookTestData,
				branchCoverage: 100,
				targetCoverage: 80.06,
				annotationsCapped: true,
				issueCounts: counts,
				totalIssues: 1335
			});
		});

	});

});
