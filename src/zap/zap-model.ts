import { TemplateData } from "../core/template/template-engine";

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
		riskcode: number;
		confidence: number;
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

	export interface WebhookMessage {
		repository: string;
		commitId: string;
		report: Report;
	}

	export interface ReportTemplate extends TemplateData {

	}
}
