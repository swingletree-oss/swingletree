"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import TwistlockStatusEmitter from "../../src/twistlock/status-emitter";
import { EventBusMock, ConfigurationServiceMock, InstallationStorageMock, TemplateEngineMock } from "../mock-classes";
import { TwistlockReportReceivedEvent } from "../../src/twistlock/events";
import { Events } from "../../src/core/event/event-model";
import { Swingletree } from "../../src/core/model";
import { TwistlockModel } from "../../src/twistlock/model";


const sandbox = sinon.createSandbox();

describe("Twistlock", () => {

	describe("status emitter", () => {
		it("should mark check run with action required on dirty report", async () => {
			const eventBusMock = new EventBusMock();

			const uut = new TwistlockStatusEmitter(
				eventBusMock,
				new ConfigurationServiceMock(),
				new TemplateEngineMock()
			);

			const source = new Swingletree.GithubSource();
			source.owner = "org";
			source.repo = "repo";

			const event = new TwistlockReportReceivedEvent(
				require("../mock/twistlock-report-all.json"),
				source
			);

			uut.reportReceivedHandler(event);

			sinon.assert.calledOnce(eventBusMock.emit as any);

			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", Events.NotificationEvent));
			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.hasNested("payload.checkStatus", sinon.match(Swingletree.Conclusion.BLOCKED)));
		});

		it("should mark check run with success on findings lower HIGH", async () => {
			const eventBusMock = new EventBusMock();

			const uut = new TwistlockStatusEmitter(
				eventBusMock,
				new ConfigurationServiceMock(),
				new TemplateEngineMock()
			);

			const source = new Swingletree.GithubSource();
			source.owner = "org";
			source.repo = "repo";

			const event = new TwistlockReportReceivedEvent(
				Object.assign({}, require("../mock/twistlock-report-clean.json")),
				source
			);

			event.report.results[0].vulnerabilities = [
				{
					"id": "CVE-2019-3857",
					"status": "fixed in 1.4.3-12.el7_6.2",
					"cvss": 8.8,
					"vector": "CVSS:3.0/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
					"description": "An integer overflow flaw which could lead to an out of bounds write was discovered in libssh2 before 1.8.1 in the way SSH_MSG_CHANNEL_REQUEST packets with an exit signal are parsed. A remote attacker who compromises a SSH server may be able to execute code on the client system when a user connects to the server.",
					"severity": TwistlockModel.VulnerabilitySeverity.MEDIUM,
					"packageName": "libssh2",
					"packageVersion": "1.4.3-12.el7",
					"link": "https://access.redhat.com/security/cve/CVE-2019-3857",
					"riskFactors": {
						"Attack vector: network": {},
						"Has fix": {},
						"Medium severity": {},
						"Recent vulnerability": {}
					}
				}
			];

			uut.reportReceivedHandler(event);

			sinon.assert.calledOnce(eventBusMock.emit as any);

			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", Events.NotificationEvent));
			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.hasNested("payload.checkStatus", sinon.match(Swingletree.Conclusion.PASSED)));
		});

		it("should mark check run with success on clean report", async () => {
			const eventBusMock = new EventBusMock();

			const uut = new TwistlockStatusEmitter(
				eventBusMock,
				new ConfigurationServiceMock(),
				new TemplateEngineMock()
			);

			const source = new Swingletree.GithubSource();
			source.owner = "org";
			source.repo = "repo";

			const event = new TwistlockReportReceivedEvent(
				require("../mock/twistlock-report-clean.json"),
				source
			);

			uut.reportReceivedHandler(event);

			sinon.assert.calledOnce(eventBusMock.emit as any);

			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", Events.NotificationEvent));
			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.hasNested("payload.checkStatus", sinon.match(Swingletree.Conclusion.PASSED)));
		});
	});

});
