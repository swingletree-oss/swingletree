"use strict";

import { Response, Request, NextFunction } from "express";
import events = require("events");
import { AppEvent } from "../models/events";
import { GitHubCommitStatus, GitHubCommitStatusContainer } from "./model/commit-status";

const unirest = require("unirest");

class EventProcessor {
  eventEmitter: any;
  apiEndpoint: string;

  constructor(eventEmitter: any) {
    this.eventEmitter = eventEmitter;
    this.eventEmitter.on(AppEvent.sendStatus, this.sendStatus);
  }

  sendStatus(status: GitHubCommitStatusContainer) {
    unirest.post(this.apiEndpoint + "/repos/" + status.repository + "/statuses/" + status.commitId)
      .headers({"Accept": "application/json", "Content-Type": "application/json"})
      .send(event)
      .end(function(response: any) {
        this.eventEmitter.emit(AppEvent.statusSent, status);
      }
    );
  }
}
