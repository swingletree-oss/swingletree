import { Condition } from "../sonar/model/sonar-quality-gate";

export class CheckRunOutput {
	public static getMarkdown(conditions: Condition[]) {
		if (conditions && conditions.length > 0) {
			let markdownTable = "|Metric|Operator|Status|Value|\n|---|---|---|---|\n";
			conditions.forEach((c) => {
				markdownTable += `|${c.metric}|${c.operator}|${c.status}|${c.value || "-"}|\n`;
			});
			return markdownTable;
		}
	}
}