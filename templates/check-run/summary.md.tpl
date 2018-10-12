{# Context Type: SummaryTemplate #}
SonarQube reported Quality Gate status: *{{ event.qualityGate.status }}*

{% if (event.qualityGate.conditions) and (event.qualityGate.conditions.length > 0) -%}
| Metric | Status   | Operator | Value  |
| :----- | :------- | :------- | :----- |
{% for c in event.qualityGate.conditions -%}
| {{ c.metric | replace("_", " ") | capitalize }} | {{ c.status }} | {{ c.operator | replace("_", " ") | title }} | {{ c.value | default("*none*") }} |
{% endfor %}
{% endif %}

{% if annotationsCapped %}
:warning: Issue annotations were capped to 50 items. The analysis reported {{ originalIssueCount }} in total. Please check SonarQube for a full report.
{% endif %}