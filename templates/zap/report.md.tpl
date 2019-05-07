{# Context Type: ZapReportTemplate -#}

{% if counts -%}
### {% for key in counts.keys() -%} {{ key | zapRiskcodeIcon | safe }} {{ counts.get(key) }} {% if loop.last == false %}&bull;{% endif -%}{% endfor -%}
{% endif %}

{% if event.report.site.length > 0 %}
### Alerts
{%  for site in event.report.site -%}
{%   for alert in site.alerts | sort(false, false, "riskcode") -%}

#### {{ alert.alert }}

{{ alert.desc | striptags }}

##### Instances
{%    for instance in alert.instances %}
* {{ instance.uri }}
{%-    endfor %}

{%    if alert.solution %}
##### Solution

{{ alert.solution | striptags }}
{%    endif %}

{%   endfor %}
{%  endfor %}
{% endif %}