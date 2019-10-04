"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { ConfigurationService } from "../src/configuration";
import { SonarConfig } from "../src/sonar/sonar-config";
import { CoreConfig } from "../src/core/core-config";
chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("ConfigurationService", () => {

	let uut: ConfigurationService;
	let envBackup;

	beforeEach(() => {
		envBackup = Object.assign({}, process.env);
		process.env = {};
	});

	afterEach(() => {
		process.env = envBackup;
	});

	describe("Sonar", () => {

		it("should use default configuration when no env vars are set", () => {
			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get(SonarConfig.BASE)).to.be.equal("http://localhost:10101");
			expect(uut.get(SonarConfig.TOKEN)).to.be.equal("1234");
			expect(uut.get(SonarConfig.SECRET)).to.be.equal("do not tell");
			expect(uut.get(SonarConfig.CONTEXT)).to.be.equal("sonarqubetest");
		});

		it("should prioritize environment variables", () => {
			process.env["SONAR_BASE"] = "envBase";
			process.env["SONAR:BASE"] = "envBase";
			process.env["SONAR_TOKEN"] = "envToken";
			process.env["SONAR_SECRET"] = "envSecret";
			process.env["SONAR_CONTEXT"] = "envContext";

			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get(SonarConfig.BASE)).to.be.equal("envBase");
			expect(uut.get(SonarConfig.TOKEN)).to.be.equal("envToken");
			expect(uut.get(SonarConfig.SECRET)).to.be.equal("envSecret");
			expect(uut.get(SonarConfig.CONTEXT)).to.be.equal("envContext");
		});
	});

	describe("GitHub", () => {

		it("should use default configuration when no env vars are set", () => {
			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get(CoreConfig.Github.BASE)).to.be.equal("http://localhost:10101");
			expect(uut.get(CoreConfig.Github.WEBHOOK_SECRET)).to.be.equal("do not tell");
			expect(uut.getNumber(CoreConfig.Github.APPID)).to.be.equal(101);
			expect(uut.get(CoreConfig.Github.KEYFILE)).to.be.equal("test/app-key.test");
			expect(uut.getBoolean(CoreConfig.Github.CLIENT_DEBUG)).to.be.false;
		});

		it("should prioritize environment variables", () => {
			process.env["GITHUB_BASE"] = "envBase";
			process.env["GITHUB_SECRET"] = "envSecret";
			process.env["GITHUB_APP_ID"] = "1337";
			process.env["GITHUB_APP_KEYFILE"] = "some other key file";
			process.env["GITHUB_DEBUG"] = "true";

			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get(CoreConfig.Github.BASE)).to.be.equal("envBase");
			expect(uut.get(CoreConfig.Github.WEBHOOK_SECRET)).to.be.equal("envSecret");
			expect(uut.getNumber(CoreConfig.Github.APPID)).to.be.equal(1337);
			expect(uut.get(CoreConfig.Github.KEYFILE)).to.be.equal("some other key file");
			expect(uut.getBoolean(CoreConfig.Github.CLIENT_DEBUG)).to.be.true;
		});
	});

	describe("Storage", () => {

		it("should use default configuration when no env vars are set", () => {
			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get(CoreConfig.Storage.DATABASE)).to.be.equal("http://localhost");
			expect(uut.get(CoreConfig.Storage.PASSWORD)).to.be.equal("somepassword");
		});

		it("should prioritize environment variables", () => {
			process.env["STORAGE_HOST"] = "envHost";
			process.env["STORAGE_PASSWORD"] = "envPassword";

			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get(CoreConfig.Storage.DATABASE)).to.be.equal("envHost");
			expect(uut.get(CoreConfig.Storage.PASSWORD)).to.be.equal("envPassword");
		});
	});

	describe("Core", () => {
		it("should be able to handle nested configuration", () => {
			process.env["PORT_SUBCONFIG1"] = "test";
			process.env["PORT"] = "correct value";
			process.env["PORT_SUBCONFIG2"] = "test two";

			uut = new ConfigurationService("./test/config.yml");

			expect(uut.get("port")).to.be.equal("correct value");
		});
	});

});
