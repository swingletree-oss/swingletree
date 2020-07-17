#!/bin/bash

BASEDIR=$(dirname "$0")

COMPONENTS=(
  deck
  gate
  harness
  plugin-junit
  plugin-nebula
  plugin-sonarqube
  plugin-template
  plugin-testng
  plugin-twistlock
  plugin-zap
  scotty
  scotty-client
  yoke
)

GIT_BASE="swingletree-oss"

for repo in "${COMPONENTS[@]}"; do
  if [ -e $BASEDIR/../../$repo ]; then
    git -C $BASEDIR/../../$repo switch master
    git -C $BASEDIR/../../$repo pull
  else
    echo "> skipping $repo (repository not present on file system)"
  fi
done
