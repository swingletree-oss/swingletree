{{- define "swingletree.config" -}}
deck:
  path: {{ .Values.deck.path }}
  elastic:
{{ toYaml .Values.elastic | indent 4 }}
  features:
{{ toYaml .Values.features | indent 4 }}
  github:
    page: {{ .Values.github.app.page }}
  cookies:
{{ toYaml .Values.cookies | indent 4 }}
  auth:
    jwt:
      secret: {{ .Values.jwt.secret }}
    github:
      clientID: {{ .Values.github.clientID }}
      clientSecret: {{ .Values.github.clientSecret }}
      authorizationURL: {{ .Values.github.authorizationURL }}
      tokenURL: {{ .Values.github.tokenURL }}
      userProfileURL: {{ .Values.github.userProfileURL }}
      callbackURL: {{ .Values.github.callbackURL }}
  port: 3000
gate: 
  api:
    token: {{ .Values.gate.api.token }}
  github:
{{ toYaml .Values.github | indent 4 }}
  plugins:
    {{- range $pluginId, $pluginConfig := .Values.plugins }}
    {{ $pluginId }}:
      enabled: {{ $pluginConfig.enabled }}
      base: "http://plugin-{{ $pluginId }}.{{ $.Release.Namespace }}:3000"
      insecure: {{ $pluginConfig.insecure }}
    {{- end }}
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
    scotty: "http://swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.zap.enabled -}}
zap:
  context: {{ .Values.plugins.zap.context }}
  urls:
    scotty: "http://swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.twistlock.enabled -}}
twistlock:
  context: {{ .Values.plugins.twistlock.context }}
  urls:
    scotty: "http://swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.sonar.enabled -}}
sonar:
  base: {{ .Values.sonar.base }}
  context: {{ .Values.plugins.sonar.context }}
  token: {{ .Values.sonar.token }}
  urls:
    scotty: "http://swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.testng.enabled -}}
testng:
  urls:
    scotty: "http://swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{ if .Values.plugins.junit.enabled -}}
junit:
  urls:
    scotty: "http://swing-scotty.{{ .Release.Namespace }}:3000"
  port: 3000
{{- end }}
{{- end -}}
