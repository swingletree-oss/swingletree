#!/bin/bash

set -e pipefail

BASEDIR=$(dirname "$0")

VALUES_YAML=$BASEDIR/../helm/swingletree/values.yaml

function addCommit {
  CMESSAGE="$SCOPE($1): update component from \`$2\` to \`$3\` [view changes](https://github.com/swingletree-oss/$1/compare/v$2...v$3)"
  echo " > adding commit:   $CMESSAGE"

  git add $VALUES_YAML
  git commit -m "$CMESSAGE"
}

function latestRelease {
  curl -su ":$GITHUB_TOKEN" "https://api.github.com/repos/swingletree-oss/${repo}/releases/latest" | jq -r '.tag_name' | sed -nr 's/v?(.*)/\1/p'
}

function currentRelease {
  yq r $BASEDIR/../helm/swingletree/values.yaml "images.$1.version"
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

VER_REGEX='([0-9]+)\.([0-9]+)\.([0-9]+)'

for repo in "${COMPONENTS[@]}"; do
  CURRENT=$( currentRelease $repo )
  LATEST=$( latestRelease $repo )
  if [ "$CURRENT" == "$LATEST" ]; then
    printf " OK       %-20s %-10s    %-10s is already on latest version\n" $repo $CURRENT
  else

    if [[ $CURRENT =~ $VER_REGEX ]]; then
      CURRENT_MAJOR=${BASH_REMATCH[1]}
      CURRENT_MINOR=${BASH_REMATCH[2]}
      CURRENT_BUGFIX=${BASH_REMATCH[3]}
    fi

    declare -a GRP_LATEST
    if [[ $LATEST =~ $VER_REGEX ]]; then
      LATEST_MAJOR=${BASH_REMATCH[1]}
      LATEST_MINOR=${BASH_REMATCH[2]}
      LATEST_BUGFIX=${BASH_REMATCH[3]}
    fi

    SCOPE=
    if [ "${CURRENT_BUGFIX}" != "${LATEST_BUGFIX}" ]; then
      SCOPE="fix"
    fi

    if [ "${CURRENT_MINOR}" != "${LATEST_MINOR}" ]; then
      SCOPE="feat"
    fi

    if [ "${CURRENT_MAJOR}" != "${LATEST_MAJOR}" ]; then
      SCOPE="feat"
    fi

    printf " UPGRADE  %-20s %-10s -> %-10s needs upgrade ($SCOPE)\n" $repo $CURRENT $LATEST

    upgrade $repo $LATEST
    addCommit $repo $CURRENT $LATEST
  fi
done