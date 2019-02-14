{# Context Type: SummaryTemplate -#}

{%- if event.targetBranch -%}
SonarQube Branch analysis was performed in relation to `{{ event.targetBranch }}`
{% endif %}

{% if issueCounts -%}
### {% for key in issueCounts.keys() -%}{{ key | ruleTypeIcon | safe }} {{ issueCounts.get(key) }} {% if loop.last == false %}&bull;{% endif -%}
{% endfor -%}
{% endif %}

{% if event.qualityGate.status == "OK" -%}
    :ok:
{%- else -%}
    :x:
{%- endif %} Quality Gate *"{{ event.qualityGate.name }}"* reported status *{{ event.qualityGate.status }}*<br>

{#- branch coverage report -#}
{% if branchCoverage -%}
{%   if targetCoverage -%}
{%     if branchCoverage != targetCoverage -%}
{%       if branchCoverage > targetCoverage -%}
:trophy: Coverage improved by {{ (branchCoverage - targetCoverage) | delta }}%
{%         else -%}
:x: Coverage loss ({{ (branchCoverage - targetCoverage) | delta }}%)
{%       endif -%}
{%     else -%}
:information_source: Coverage stable at {{ branchCoverage }}%
{%     endif -%}
{%   else -%}
:information_source: Coverage of branch at {{ branchCoverage }}%
{%   endif -%}
{% endif %}

{% if (event.qualityGate.conditions) and (event.qualityGate.conditions.length > 0) -%}
### Gate Conditions

| Metric | | Status | Constraint | Current Value |
| :-- | :--: | :-- | :-- | :-- | 
{%   for c in event.qualityGate.conditions | sort(false, false, "metric") -%}
{{     c.metric | replace("_", " ") | capitalize }} | {{ c.status | gateStatusIcon }} | {{ c.status }} | {{ c.operator | gateConditionIcon | safe }} {{ c.errorThreshold }} | {{ c.value | default("*none*") }} |
{%   endfor %}
{% endif -%}

{% if annotationsCapped -%}
:warning: Issue annotations were capped to 50 items. The analysis reported {{ totalIssues }} in total. Please check SonarQube for a full report.
{% endif %}