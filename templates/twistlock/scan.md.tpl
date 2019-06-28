{# Context Type: TwistlockModel.Template -#}

{% if report.results.length > 0 %}
{%  for result in report.results -%}

## Summary

| Type | Critical | High | Medium | Low | Total |
|:--- |:---:|:---:|:---:|:---:|:---:|
| Compliance | {{ result.complianceDistribution.critical }} | {{ result.complianceDistribution.high }} | {{ result.complianceDistribution.medium }} | {{ result.complianceDistribution.low }} | {{ result.complianceDistribution.total }} |
| Vulnerabilities | {{ result.vulnerabilityDistribution.critical }} | {{ result.vulnerabilityDistribution.high }} | {{ result.vulnerabilityDistribution.medium }} | {{ result.vulnerabilityDistribution.low }} | {{ result.vulnerabilityDistribution.total }} |


## Vulnerabilities
{%   for vul in result.vulnerabilities | sort(true, false, "cvss") -%}
### {{ vul.id }}

| CVSS | Severity | Package | Version | |
| --- | --- | --- | --- | --- |
| {{ vul.cvss }} | {{ vul.severity }} | {{ vul.packageName }} | {{ vul.packageVersion }} | [details]({{ vul.link }}) |

<details><summary>show description</summary><p><ul>
<blockquote>{{ vul.description }}</blockquote>
</ul></p></details>

{%-    if vul.vector %}

#### Vector

`{{ vul.vector }}`
{%    endif -%}

{%    if vul.vector -%}
#### Risk Factors
{%       for factor in vul.riskFactors | keys -%}
* {{ factor }}
{%       endfor %}
{%-    endif %}

---
{%   endfor %}
{%  endfor %}
{% endif %}
