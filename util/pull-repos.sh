#!/bin/bash

BASEDIR=$(dirname "$0")

COMPONENTS=(
  gate
  deck
  scotty
  plugin-nebula
  plugin-sonarqube
  plugin-twistlock
  plugin-zap
  harness
  yoke
)

GIT_BASE="swingletree-oss"

for repo in "${COMPONENTS[@]}"; do
  if [ -e $BASEDIR/../../$repo ]; then
    git -C $BASEDIR/../../$repo pull
  else
    echo "> skipping $repo (repository not present on file system)"
  fi
done
