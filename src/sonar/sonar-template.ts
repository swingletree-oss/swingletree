import { CheckRunSummaryTemplate } from "../core/template/model/summary-template";
import { SonarWebhookEvent } from "./model/sonar-wehook-event";

export interface SonarCheckRunSummaryTemplate extends CheckRunSummaryTemplate {
	event: SonarWebhookEvent;

	/** sonar coverage measure value of target branch */
	targetCoverage?: number;

	/** sonar coverage measure of analyzed branch */
	branchCoverage?: number;

	/** were annotations capped to a specific amount? */
	annotationsCapped?: boolean;

	/** original issue count, in the case of annotation capping */
	issueCounts?: Map<string, number>;

	totalIssues?: number;
}