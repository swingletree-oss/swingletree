"use strict";

export enum QualityGateStatus {
  OK = "OK"
}

export class QualityGate {
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