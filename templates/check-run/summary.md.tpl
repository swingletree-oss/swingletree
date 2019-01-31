{# Context Type: SummaryTemplate #}

{% if issueCounts -%}
### {% for key in issueCounts.keys() -%}{{ key | ruleTypeIcon | safe }} {{ issueCounts.get(key) }} {% if loop.last == false %}&bull;{% endif -%}
{% endfor -%}
{% endif %}

SonarQube reported Quality Gate *"{{ event.qualityGate.name }}"* with status: *{{ event.qualityGate.status }}*

{% if (event.qualityGate.conditions) and (event.qualityGate.conditions.length > 0) -%}
### Conditions

| Metric |      | Status   | Constraint | Current Value |
| :----- | :--: | :------- | :----- | :----- | 
{% for c in event.qualityGate.conditions | sort(false, false, "metric") -%}
| {{ c.metric | replace("_", " ") | capitalize }} | {{ c.status | gateStatusIcon }} | {{ c.status }} | {{ c.operator | gateConditionIcon | safe }} {{ c.errorThreshold }} | {{ c.value | default("*none*") }} |
{% endfor %}
{% endif %}

{% if annotationsCapped %}
:warning: Issue annotations were capped to 50 items. The analysis reported {{ totalIssues }} in total. Please check SonarQube for a full report.
{% endif %}