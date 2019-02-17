"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import SonarClient from "../../src/sonar/client/sonar-client";
import { ConfigurationServiceMock, EventBusMock, TokenStorageMock, InstallationStorageMock } from "../mock-classes";
import GithubClientService from "../../src/core/github/client/github-client";
import { ConfigurationService } from "../../src/configuration";
import TokenStorage from "../../src/core/github/client/token-storage";
import InstallationStorage from "../../src/core/github/client/installation-storage";

const sandbox = sinon.createSandbox();

describe("GitHub Client", () => {
	const mockPort = 10101;
	let mockServer: any;
	let uut: GithubClientService;

	let configurationMock: ConfigurationService;
	let tokenStorage: TokenStorage;
	let installationStorage: InstallationStorage;

	before(() => {
		const http = require("http");

		const config = {
			get: sinon.stub().returns({
				sonar: {
					base: "http://localhost:" + mockPort
				}
			})
		};

		mockServer = http.createServer(require("mockserver")("./test/mock", process.env.DEBUG == "true")).listen(mockPort);
	});

	after(function () {
		mockServer.close();
	});


	beforeEach(function () {
		configurationMock = new ConfigurationServiceMock();
		tokenStorage = new TokenStorageMock();
		installationStorage = new InstallationStorageMock();

		uut = new GithubClientService(configurationMock, tokenStorage, installationStorage);
		(uut as any).createJWT = sinon.stub().returns("JWTTOKEN");
	});

	afterEach(function () {
		sandbox.restore();
	});


	it("should be able to retrieve a bearer token on token cache miss", async () => {
		tokenStorage.getToken = sinon.stub().resolves(null);
		const result = await (uut as any).retrieveBearerToken("test");
		expect(result).to.equal("v1.1f699f1069f60xxx");
	});

	it("should cache bearer token after successful retrieval", async () => {
		tokenStorage.getToken = sinon.stub().resolves(null);
		await (uut as any).retrieveBearerToken("test");
		sinon.assert.calledWith(tokenStorage.store as any, sinon.match("test"), sinon.match.has("token", "v1.1f699f1069f60xxx"));
	});

	it("should prefer a token from cache when available", async () => {
		tokenStorage.getToken = sinon.stub().resolves("mocktoken");
		const result = await (uut as any).retrieveBearerToken("test");
		expect(result).to.equal("mocktoken");
	});

});
