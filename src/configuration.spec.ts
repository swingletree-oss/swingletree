"use strict";

import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { SonarConfig, GithubConfig, StorageConfig } from "./configuration";
chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Configuration", () => {

	let envBackup;

	beforeEach(() => {
		envBackup = process.env;
	});

	afterEach(() => {
		process.env = envBackup;
	});

	describe("Sonar", () => {
		let uut: SonarConfig;

		it("should use default configuration when no env vars are set", () => {
			uut = new SonarConfig({
				base: "base",
				token: "token"
			});

			expect(uut.base).to.be.equal("base");
			expect(uut.token).to.be.equal("token");
		});

		it("should prioritize environment variables", () => {
			process.env["SONAR_BASE"] = "envBase";
			process.env["SONAR_TOKEN"] = "envToken";

			uut = new SonarConfig({
				base: "base",
				token: "token"
			});

			expect(uut.base).to.be.equal("envBase");
			expect(uut.token).to.be.equal("envToken");
		});
	});

	describe("GitHub", () => {
		let uut: GithubConfig;

		it("should use default configuration when no env vars are set", () => {
			uut = new GithubConfig({
				base: "base",
				webhookSecret: "secret",
				appId: 101,
				keyFile: "testfile"
			});

			expect(uut.base).to.be.equal("base");
			expect(uut.webhookSecret).to.be.equal("secret");
			expect(uut.appId).to.be.equal(101);
			expect(uut.keyFile).to.be.equal("testfile");
		});

		it("should prioritize environment variables", () => {
			process.env["GITHUB_BASE"] = "envBase";
			process.env["GITHUB_SECRET"] = "envSecret";
			process.env["GITHUB_APPID"] = "1337";

			uut = new GithubConfig({
				base: "base",
				webhookSecret: "secret",
				appId: 101,
				keyFile: "testfile"
			});

			expect(uut.base).to.be.equal("envBase");
			expect(uut.webhookSecret).to.be.equal("envSecret");
			expect(uut.appId).to.be.equal(1337);
		});
	});

	describe("Storage", () => {
		let uut: StorageConfig;

		it("should use default configuration when no env vars are set", () => {
			uut = new StorageConfig({
				database: "database",
				password: "password"
			});

			expect(uut.database).to.be.equal("database");
			expect(uut.password).to.be.equal("password");
		});

		it("should prioritize environment variables", () => {
			process.env["DATABASE_HOST"] = "envHost";
			process.env["DATABASE_PASSWORD"] = "envPassword";

			uut = new StorageConfig({
				database: "database",
				password: "password"
			});

			expect(uut.database).to.be.equal("envHost");
			expect(uut.password).to.be.equal("envPassword");
		});
	});

});
