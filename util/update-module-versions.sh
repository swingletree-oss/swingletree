#!/bin/bash

BASEDIR=$(dirname "$0")

VALUES_YAML=$BASEDIR/../helm/swingletree/values.yaml

function addCommit {
  CMESSAGE="feat($1): update component from \`$2\` to \`$3\` [view changes](https://github.com/swingletree-oss/$1/compare/v$2...v$3)"
  echo " > adding commit:   $CMESSAGE"

  git add $VALUES_YAML
  git commit -m "$CMESSAGE"
}

function latestRelease {
  curl -su ":$GITHUB_TOKEN" "https://api.github.com/repos/swingletree-oss/${repo}/releases/latest" | jq -r '.tag_name' | sed -nr 's/v?(.*)/\1/p'
}

function currentRelease {
  yq -r '.images["'$1'"].version' $BASEDIR/../helm/swingletree/values.yaml
}

function upgrade {
  sed -i -r 's/^(\s*version:\s*)([[:digit:]]+\.?)+(\s*#'$1'_VERSION)$/\1'$2'\3/gm' $VALUES_YAML
}

COMPONENTS=(
  'gate'
  'deck'
  'scotty'
  'plugin-nebula'
  'plugin-sonarqube'
  'plugin-twistlock'
  'plugin-zap'
  'plugin-testng'
)

for repo in "${COMPONENTS[@]}"; do
  CURRENT=$( currentRelease $repo )
  LATEST=$( latestRelease $repo )
  if [ "$CURRENT" == "$LATEST" ]; then
    printf " OK       %-20s %-10s    %-10s is already on latest version\n" $repo $CURRENT
  else
    printf " UPGRADE  %-20s %-10s -> %-10s needs upgrade\n" $repo $CURRENT $LATEST
    upgrade $repo $LATEST
    addCommit $repo $CURRENT $LATEST
  fi
done