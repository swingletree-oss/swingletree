#!/bin/sh
BASEDIR=$(dirname "$0")

helm package ${BASEDIR}/helm/swingletree --app-version $1 --version $1 --dependency-update -d ${BASEDIR}/helm/dist