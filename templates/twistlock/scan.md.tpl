{#- Context Type: TwistlockModel.Template -#}

{%- if issues.complianceIssues.length + issues.vulnerabilityIssues.length > 0 %}

{%-   if issues.complianceIssues.length > 0 -%}

## {{ issues.conplianceIssues.length }} Compliance Issues
{%     for compliance in issues.complianceIssues -%}
* **{{ compliance.severity }}:** {{ compliance.title }}
{%     endfor %}
{%-   endif %}

{%   if issues.vulnerabilityIssues.length > 0 -%}

## {{ issues.vulnerabilityIssues.length }} Vulnerabilities
{%     for vul in issues.vulnerabilityIssues | sort(true, false, "cvss") %}
<details><summary><b>{{ vul.severity | twistlockVulnSeverity }} {{ vul.cvss }}</b>: {{ vul.id }} </summary><p><ul>

| CVSS | Severity | Package | Version | Status |
| --- | --- | --- | --- | --- |
| {{ vul.cvss }} | {{ vul.severity }} | {{ vul.packageName }} | {{ vul.packageVersion }} | {{ vul.status | default("-") }} |

{{ vul.description }} [more details]({{ vul.link }})


{%       if vul.vector -%}
`{{ vul.vector }}`
{%-      endif %}

{%       if vul.riskFactors -%}
{%         for factor in vul.riskFactors | keys -%}`{{ factor }}` {% if not loop.last %}, {% endif %}{% endfor %}
{%-      endif %}
</ul></p></details>
{%     endfor -%}
{%   endif -%}
{% endif -%}

{% if issues.ignoredVulnerabilityIssues.length > 0 or issues.ignoredComplianceIssues.length > 0 %}
## Whitelisted issues

{%   if issues.ignoredVulnerabilityIssues.length > 0 -%}
<details><summary>{{ issues.ignoredVulnerabilityIssues.length }} ignored vulnerabilities</summary><p><ul>

| ID | Severity | Whitelist Cause |
| --- | --- | --- |
{%     for ignored in issues.ignoredVulnerabilityIssues -%}
| {{ ignored.id }} | {{ ignored.severity }} | {{ issues.whitelist.get(ignored.id) | default("*did not reach specified thresholds*") }} |
{%     endfor %}

</ul></p></details>
{%   endif %}

{%   if issues.ignoredComplianceIssues.length > 0 -%}

<details><summary>{{ issues.ignoredComplianceIssues.length }} ignored compliance issues</summary><p><ul>

| Title | Whitelist Cause |
| --- | --- |
{%     for ignored in issues.ignoredComplianceIssues -%}
| {{ ignored.title }} | {{ issues.whitelist.get(ignored.title) | default("*did not reach specified thresholds*") }} |
{%     endfor %}

</ul></p></details>
{%   endif %}
{% endif %}
