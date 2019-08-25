"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));

import SonarStatusEmitter from "../../src/sonar/sonar-status-emitter";

import { ConfigurationServiceMock, EventBusMock, SonarClientMock, TemplateEngineMock } from "../mock-classes";
import { SonarAnalysisCompleteEvent, SonarEvents } from "../../src/sonar/events";
import EventBus from "../../src/core/event/event-bus";
import { Events } from "../../src/core/event/event-model";

describe("Sonar Status Emitter", () => {

	let uut: SonarStatusEmitter;
	let analysisData: SonarAnalysisCompleteEvent;
	let eventMock: EventBus;
	let mockServer;

	before(() => {
		const http = require("http");

		const config = {
			get: sinon.stub().returns({
				sonar: {
					base: "http://localhost:10101"
				}
			})
		};

		mockServer = http.createServer(require("mockserver")("./test/mock", process.env.DEBUG == "true")).listen(10101);
	});

	after(function () {
		mockServer.close();
	});

	beforeEach(function () {
		const sonarClientMock = new SonarClientMock();
		eventMock = new EventBusMock();

		uut = new SonarStatusEmitter(
			eventMock,
			new ConfigurationServiceMock(),
			sonarClientMock,
			new TemplateEngineMock()
		);

		analysisData = {
			id: "id",
			getEventType: sinon.stub(),
			owner: "test",
			repository: "testrepo",
			commitId: "abc",
			eventType: SonarEvents.SonarAnalysisComplete,
			analysisEvent: {
				analysedAt: (new Date()).toISOString(),
				branch: {
					isMain: false,
					name: "dev"
				},
				changedAt: (new Date()).toISOString(),
				project: {
					key: "test",
					name: "name"
				},
				properties: { },
				qualityGate: {
					conditions: [],
					name: "test",
					status: "OK"
				},
				serverUrl: "",
				status: "OK",
				taskId: "task"
			}
		};
	});


	it("should calculate branch delta for short living branches", async () => {
		await uut.analysisCompleteHandler(analysisData);

		sinon.assert.calledOnce(eventMock.emit as any);

		sinon.assert.calledWith(eventMock.emit as any, sinon.match.has("eventType", Events.NotificationEvent));
		sinon.assert.calledWith(eventMock.emit as any, sinon.match.hasNested("payload.title", sinon.match("- Coverage: 90.1 (+2.1%)")));
	});

	it("should calculate branch delta for long living branches", async () => {
		analysisData.analysisEvent.branch.isMain = true;
		analysisData.analysisEvent.branch.name = undefined;
		analysisData.analysisEvent.project.key = "test";
		await uut.analysisCompleteHandler(analysisData);

		sinon.assert.calledOnce(eventMock.emit as any);

		sinon.assert.calledWith(eventMock.emit as any, sinon.match.has("eventType", Events.NotificationEvent));
		sinon.assert.calledWith(eventMock.emit as any, sinon.match.hasNested("payload.title", sinon.match("- Coverage: 70.6 (-19.5%)")));
	});

	it("should not contain undefined annotation paths in GitHub check run", async () => {
		analysisData.analysisEvent.project.key = "component-subproject-test";
		await uut.analysisCompleteHandler(analysisData);

		sinon.assert.calledOnce(eventMock.emit as any);

		sinon.assert.calledWith(eventMock.emit as any,
			sinon.match.hasNested("payload.annotations",
				sinon.match.every(
					sinon.match.has("path", sinon.match((path) => { return path; }))
				)
			)
		);
	});

	it("should determine annotation paths", async () => {
		analysisData.analysisEvent.project.key = "component-subproject-test";
		await uut.analysisCompleteHandler(analysisData);

		sinon.assert.calledOnce(eventMock.emit as any);

		sinon.assert.calledWith(eventMock.emit as any, sinon.match.hasNested("payload.annotations[0]",
			sinon.match.has("path", "backend/src/main/java/testpkg/Constants.java"))
		);
	});

});
