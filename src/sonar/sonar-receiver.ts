"use strict";

import { Response, Request, NextFunction } from "express";
import { AppEvent } from "../models/events";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";

import events = require("events");
const unirest = require("unirest");

class SonarWebhook {
  eventEmitter: any;
  apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
    this.eventEmitter = new events.EventEmitter();
  }

  private isWebhookEventRelevant(event: SonarWebhookEvent) {
    if (event.properties !== undefined) {
      return event.properties.hasOwnProperty("sonar.analysis.branch") &&
        event.properties.hasOwnProperty("sonar.analysis.commitId");
    }
    return true; // TODO: check for analyze marker property in properties section // get target branch from there?
  }

  webhook(req: Request, res: Response) {
    const event = <SonarWebhookEvent>(req.body);

    
  }
}
