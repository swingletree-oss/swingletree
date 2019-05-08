{# Context Type: ZapReportTemplate -#}

{% if event.report.site.length > 0 %}
{%  for site in event.report.site -%}
{%   for alert in site.alerts | sort(true, false, "riskcode") -%}

### {{ alert.riskcode | zapRiskcodeIcon | safe }} {{ alert.alert }}

**Risk(Confidence):** {{ alert.riskdesc }}

{{ alert.desc | striptags }}

<details><summary>show affected instances</summary><p><ul>
{%-    for instance in alert.instances %}
<li>{{ instance.uri }}</li>
{%-    endfor -%}
</ul></p></details>

{%    if alert.solution %}
#### Solution

{{ alert.solution | striptags }}
{%    endif %}
---
{%   endfor %}
{%  endfor %}
{% endif %}