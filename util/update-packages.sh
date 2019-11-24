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
)

for repo in "${COMPONENTS[@]}"; do
  pushd $BASEDIR/../../$repo
  npm update --save
  npm update --save-dev
  npm test
  popd
done