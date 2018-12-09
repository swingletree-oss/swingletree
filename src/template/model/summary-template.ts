import { TemplateData } from "../template-engine";
import { SonarWebhookEvent } from "../../sonar/model/sonar-wehook-event";

export interface SummaryTemplate extends TemplateData {
	event: SonarWebhookEvent;

	/** were annotations capped to a specific amount? */
	annotationsCapped?: boolean;

	/** original issue count, in the case of annotation capping */
	issueCounts?: Map<string, number>;

	totalIssues?: number;
}