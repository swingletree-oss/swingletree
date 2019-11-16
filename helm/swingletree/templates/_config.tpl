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
  {{ range $plugin := .Values.plugins -}}
  - id: {{ . }}
    base: "http://plugin-{{ . }}.{{ $.Release.Namespace }}:3000"
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
nebula:
  context: {{ .Values.nebula.context }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
zap:
  context: {{ .Values.zap.context }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
twistlock:
  context: {{ .Values.twistlock.context }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
sonar:
  base: {{ .Values.sonar.base }}
  context: {{ .Values.sonar.context }}
  token: {{ .Values.sonar.token }}
  urls:
    scotty: "swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end -}}
