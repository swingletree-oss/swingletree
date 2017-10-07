"use strict";

import { expect } from 'chai';

import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../app-events";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { GitHubCommitStatusContainer } from "../github/model/commit-status";

import { SonarWebhook } from "./sonar-webhook";
import { EventEmitter } from "events";


describe("Sonar Webhook", () => {
  let emitter: EventEmitter;
  let unit: SonarWebhook;
  let testData: any;
    
  beforeEach(function () {
    emitter = new EventEmitter();
    unit = new SonarWebhook(emitter);
    testData = Object.assign({}, require("../../test/base-sonar-webhook.json"));
  });
  
  
  it("should send commit status event on relevant hook", (done) => {
    
    testData.properties = {
      "sonar.analysis.ghPrGate": "respond",
      "sonar.analysis.branch": "testBranch",
      "sonar.analysis.commitId": "12345",
      "sonar.analysis.repository": "testOrg/testRepo"
    };
    
    emitter.on(AppEvent.sendStatus, function (data: GitHubCommitStatusContainer) {
      expect(data.commitId).to.equal("12345");
      expect(data.repository).to.equal("testOrg/testRepo");
      expect(data.payload).to.not.be.undefined;
      done();
    });
    
    emitter.on(AppEvent.webhookEventIgnored, function () {
      done(new Error("webhook event was ignored."))
    });

    unit.webhook({
      body: testData
    });
  });
  
  it("should send ignored event on missing properties", (done) => {
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal(SonarWebhook.IGNORE_ID);
      done();
    });

    unit.webhook({
      body: testData
    });
  });
  
  it("should not send ignored event on empty properties", (done) => {
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal(SonarWebhook.IGNORE_ID);
      done();
    });

    unit.webhook({
      body: testData
    });
  });
  
  it("should not send ignored event on partially set properties", (done) => {
    testData.properties = {
      "sonar.analysis.branch": "testBranch",
      "sonar.analysis.commitId": "12345"
    };
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal(SonarWebhook.IGNORE_ID);
      done();
    });

    unit.webhook({
      body: testData
    });
  });
});
