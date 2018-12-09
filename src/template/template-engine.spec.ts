"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "./template-engine";
import { SummaryTemplate } from "./model/summary-template";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { Template } from "nunjucks";
import { RuleType } from "../sonar/model/sonar-issue";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Template Engine", () => {

	let envBackup;
	let sonarWebhookTestData;

	beforeEach(() => {
		envBackup = process.env;
		sonarWebhookTestData = Object.assign({}, require("../../test/sonar/base-sonar-webhook.json"));
	});

	afterEach(() => {
		process.env = envBackup;
	});

	describe("GitHub Check Summary", () => {
		let uut: TemplateEngine;

		it("should compile the template", () => {
			uut = new TemplateEngine();

			uut.template(Templates.CHECK_RUN_SUMMARY, undefined);
		});

		it("should run template with test data", () => {
			uut = new TemplateEngine();

			const counts = new Map<string, number>();
			counts.set(RuleType.BUG, 20);
			counts.set(RuleType.CODE_SMELL, 30);
			counts.set(RuleType.SECURITY_HOTSPOT, 40);
			counts.set(RuleType.VULNERABILITY, 100);

			uut.template<SummaryTemplate>(Templates.CHECK_RUN_SUMMARY, {
				event: sonarWebhookTestData,
				annotationsCapped: true,
				issueCounts: counts,
				totalIssues: 1335
			});
		});

	});

});
