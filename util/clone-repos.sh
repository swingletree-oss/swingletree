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

GIT_BASE="swingletree-oss"

for repo in "${COMPONENTS[@]}"; do
  git -C $BASEDIR/../.. clone git@github.com:$GIT_BASE/$repo
done