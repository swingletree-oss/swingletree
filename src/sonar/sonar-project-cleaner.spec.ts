"use strict";

import { AppEvent } from "../models/events";
import { EventEmitter } from "events";
import { SonarProjectCleaner } from "./sonar-project-cleaner";

import { expect, assert } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';

chai.use(require("sinon-chai"));

const unirest = require("unirest");
const sandbox = sinon.createSandbox();

describe("SonarProjectCleaner", () => {
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
		emitter.on(AppEvent.sonarProjectDeleted, function (deletedId) {
			sinon.assert.calledWith(postStub, "testApi/api/projects/delete")
			done();
    });
				
		emitter.emit(AppEvent.branchDeleted, projectId);
  });
	
});