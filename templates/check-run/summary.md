{# Context Type: SonarWebhookEvent #}
SonarQube reported Quality Gate status: *{{ qualityGate.status }}*

{% if (qualityGate.conditions) and (qualityGate.conditions.length > 0) -%}
| Metric | Status   | Operator | Value  |
| :----- | :------- | :------- | :----- |
{% for c in qualityGate.conditions -%}
| {{ c.metric | replace("_", " ") | capitalize }} | {{ c.status }} | {{ c.operator | replace("_", " ") | title }} | {{ c.value | default("*none*") }} |
{% endfor %}
{% endif %}