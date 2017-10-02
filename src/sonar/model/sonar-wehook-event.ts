"use strict";

export class SonarWebhookEvent {
  analysedAt: Date;
  project: Object;
  properties: Object;

  serverUrl: string;
  status: string;
  taskId: string;
}

class QualityGate {
  conditions: Condition[];
  name: string;
  status: string;
}

class Condition {
  errorThreshold: string;
  metric: string;
  onLeakPeriod: boolean;
  operator: string;
  status: string;
  value: string;
}