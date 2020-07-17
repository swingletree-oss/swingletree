#!/bin/bash

BASEDIR=$(dirname "$0")

COMPONENTS=(
  deck
  gate
  harness
  plugin-junit
  plugin-nebula
  plugin-sonarqube
  plugin-testng
  plugin-twistlock
  plugin-zap
  scotty
  scotty-client
)

for repo in "${COMPONENTS[@]}"; do
  pushd $BASEDIR/../../$repo
  npm update --save
  npm update --save-dev
  npm audit --fix
  npm test
  popd
done