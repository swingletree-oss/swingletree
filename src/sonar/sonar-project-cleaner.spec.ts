"use strict";

import { AppEvent } from "../app-events";
import { EventEmitter } from "events";
import { SonarProjectCleaner } from "./sonar-project-cleaner";

import { expect, assert } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';

chai.use(require("sinon-chai"));

const unirest = require("unirest");
const sandbox = sinon.createSandbox();

describe("Sonar Project Cleaner", () => {
	let unit: SonarProjectCleaner;
	let emitter: EventEmitter;
	
	let postStub: sinon.SinonSpy;
	let unirestMock: any;
	
	let projectId: string;
	
  beforeEach(function () {
		projectId = "test:project:id";
		emitter = new EventEmitter();
		unit = new SonarProjectCleaner(emitter, "testApi", "testToken");
		
		unirestMock = {};
		unirestMock.headers = sinon.stub().returnsThis;
		unirestMock.queryString = sinon.stub().returnsThis;
		unirestMock.send = sinon.stub().returnsThis;
		unirestMock.end = sinon.stub().yieldsOn(unit, { error: false });
		
    postStub = sandbox.stub(unirest, 'post').returns(unirestMock);
		
  });
	
  afterEach(function () {
    sandbox.restore();
  });
	
		
  it("should send delete to api on deleteBranch event", (done) => {
		emitter.on(AppEvent.sonarProjectDeleted, function (success, deletedId) {
			sinon.assert.calledWith(postStub, "testApi/api/projects/delete")
			expect(success).to.be.true;
			done();
    });
				
		emitter.emit(AppEvent.branchDeleted, projectId);
  });
	
  it("should report failure on deletion error", (done) => {
		unirestMock.end = sinon.stub().yieldsOn(unit, { error: true });
		
		emitter.on(AppEvent.sonarProjectDeleted, function (success, deletedId) {
			expect(success).to.be.false;
			done();
    });
				
		emitter.emit(AppEvent.branchDeleted, projectId);
  });
	
});