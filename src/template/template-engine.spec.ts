"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "./template-engine";
import { SonarWebhookEvent } from "../sonar/model/sonar-wehook-event";
import { Template } from "nunjucks";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Template Engine", () => {

	let envBackup;
	let sonarWebhookTestData;

	beforeEach(() => {
		envBackup = process.env;
		sonarWebhookTestData = Object.assign({}, require("../../test/base-sonar-webhook.json"));
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

			uut.template(Templates.CHECK_RUN_SUMMARY, sonarWebhookTestData);
		});

	});

});
