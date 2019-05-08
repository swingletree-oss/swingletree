import { TemplateData } from "../core/template/template-engine";
import { ZapReportReceivedEvent } from "./zap-events";

export namespace Zap {

	export interface Report {
		"@version": string;
		"@generated": string;
		site: Site[];
	}

	interface Site {
		"@name": string;
		"@host": string;
		"@port": number;
		"@ssl": boolean;
		alerts: Alert[];
	}

	interface Alert {
		pluginid: string;
		alert: string;
		name: string;
		riskcode: Riskcode;
		confidence: Confidence;
		riskdesc: string;
		desc: string;
		instances: Instance[];
		count: number;
		solution?: string;
		reference: string;
		cweid: string;
		wascid: string;
		sourceid: string;
	}

	interface Instance {
		uri: string;
		method: string;
		param: string;
		evidence?: string;
	}

	export enum Riskcode {
		HIGH = 3,
		MEDIUM = 2,
		LOW = 1,
		INFORMATIONAL = 0
	}

	export enum Confidence {
		USER_CONFIRMED = 4,
		HIGH = 3,
		MEDIUM = 2,
		LOW = 1,
		FALSE_POSITIVE = 0
	}

	export interface ReportTemplate extends TemplateData {
		event: ZapReportReceivedEvent;
		counts: Map<Riskcode, number>;
	}
}
