{# Context Type: TwistlockModel.Template -#}

{% if issues.complianceIssues.length + issues.vulnerabilityIssues.length > 0 %}

## Summary

| Type | Critical | High | Medium | Low |
|:--- |:---:|:---:|:---:|:---:|:---:|
| Compliance | {{ issues.complianceCounts.critical }} | {{ issues.complianceCounts.high }} | {{ issues.complianceCounts.medium }} | {{ issues.complianceCounts.low }} |
| Vulnerabilities | {{ issues.vulnerabilityCounts.critical }} | {{ issues.vulnerabilityCounts.high }} | {{ issues.vulnerabilityCounts.medium }} | {{ issues.vulnerabilityCounts.low }} |

{%   if issues.complianceIssues.length > 0 -%}
## Compliance Issues
{%     for compliance in issues.complianceIssues -%}
* **{{ compliance.severity }}:** {{ compliance.title }}
{%     endfor %}
{%   endif %}

{%   if issues.vulnerabilityIssues.length > 0 -%}
## Vulnerabilities
{%     for vul in issues.vulnerabilityIssues | sort(true, false, "cvss") -%}
### {{ vul.id }}

| CVSS | Severity | Package | Version | |
| --- | --- | --- | --- | --- |
| {{ vul.cvss }} | {{ vul.severity }} | {{ vul.packageName }} | {{ vul.packageVersion }} | [details]({{ vul.link }}) |

<details><summary>show description</summary><p><ul>
<blockquote>{{ vul.description }}</blockquote>
</ul></p></details>

{%-      if vul.vector %}
#### Vector

`{{ vul.vector }}`
{%       endif -%}

{%       if vul.vector -%}
#### Risk Factors
{%         for factor in vul.riskFactors | keys -%}
* {{ factor }}
{%         endfor %}
{%-      endif %}
{%     endfor %}
{%   endif %}

---

{% endif %}

{% if issues.ignoredVulnerabilityIssues.length > 0 %}
## Ignored Vulnerabilities

| ID | Severity | Exception Cause |
| --- | --- | --- |
{%   for ignored in issues.ignoredVulnerabilityIssues -%}
| {{ ignored.id }} | {{ ignored.severity }} | {{ issues.exceptions.get(ignored.id) }} |
{%   endfor %}
{% endif %}

{% if issues.ignoredComplianceIssues.length > 0 %}
## Ignored Compliance Issues

| ID | Exception Cause |
| --- | --- |
{%   for ignored in issues.ignoredComplianceIssues -%}
| {{ ignored.id }} | {{ issues.exceptions.get(ignored.id) }} |
{%   endfor %}
{% endif %}
