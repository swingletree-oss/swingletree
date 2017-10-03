"use strict";

import { expect } from 'chai';

import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../models/events";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";
import { GitHubCommitStatusContainer } from "../github/model/commit-status";

import { SonarWebhook } from "./sonar-receiver";
import { EventEmitter } from "events";

function generateHookData() {
  return Object.assign({}, require("../../test/base-sonar-webhook.json"));
}

describe("Sonar Webhook", () => {
  it("should send commit status event on relevant hook", (done) => {
    let emitter = new EventEmitter();
    
    let testData = generateHookData();
    
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

    let unit = new SonarWebhook(emitter);
    unit.webhook({
      body: testData
    });
  });
  
  it("should send ignored event on missing properties", (done) => {
    let emitter = new EventEmitter();

    let testData = generateHookData();
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("sonar");
      done();
    });

    let unit = new SonarWebhook(emitter);
    unit.webhook({
      body: testData
    });
  });
  
  it("should not send ignored event on empty properties", (done) => {
    let emitter = new EventEmitter();

    let testData = generateHookData();
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("sonar");
      done();
    });

    let unit = new SonarWebhook(emitter);
    unit.webhook({
      body: testData
    });
  });
  
  it("should not send ignored event on partially set properties", (done) => {
    let emitter = new EventEmitter();

    let testData = generateHookData();
    
    testData.properties = {
      "sonar.analysis.branch": "testBranch",
      "sonar.analysis.commitId": "12345"
    };
    
    emitter.on(AppEvent.webhookEventIgnored, function (data) {
      expect(data).to.equal("sonar");
      done();
    });

    let unit = new SonarWebhook(emitter);
    unit.webhook({
      body: testData
    });
  });
});
