{{- define "swingletree.config" -}}
deck:
  path: {{ .Values.deck.path }}
  elastic:
{{ toYaml .Values.elastic | indent 4 }}
  features:
{{ toYaml .Values.features | indent 4 }}
  github:
    page: {{ .Values.github.page }}
  port: 3000
gate: 
  api:
    token: {{ .Values.gate.api.token }}
  plugins:
  {{ range $pluginId, $pluginConfig := .Values.plugins -}}
    {{ $pluginId }}:
      enabled: {{ $pluginConfig.enabled }}
      base: "http://plugin-{{ $pluginId }}.{{ $.Release.Namespace }}:3000"
  {{ end -}}
  port: 3000
scotty:
  storage:
    host: {{ .Values.redis.fullnameOverride }}-master.{{ .Release.Namespace }}
    password: {{ .Values.redis.password }}
  elastic:
{{ toYaml .Values.elastic | indent 4 }}
  github:
{{ toYaml .Values.github | indent 4 }}
  port: 3000

{{ if .Values.plugins.nebula.enabled -}}
nebula:
  context: {{ .Values.plugins.nebula.context }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.zap.enabled -}}
zap:
  context: {{ .Values.plugins.zap.context }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.twistlock.enabled -}}
twistlock:
  context: {{ .Values.plugins.twistlock.context }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.sonar.enabled -}}
sonar:
  base: {{ .Values.sonar.base }}
  context: {{ .Values.sonar.context }}
  token: {{ .Values.plugins.sonar.token }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{- end -}}
