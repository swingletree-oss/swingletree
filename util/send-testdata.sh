#!/bin/bash

BASEDIR=$(dirname "$0")

BUILD_UUID=$(pwgen 20 1)

TEMP=`getopt -o o:,r:,s:,b: --long owner:,repo:,sha:,branch: -- "$@"`

NEBULA_TESTDATA=$BASEDIR/../../plugin-nebula/test/mock/nebula/build-call.json
TWISTLOCK_TESTDATA_ALL=$BASEDIR/../../plugin-twistlock/test/mock/twistlock-report-all.json
TWISTLOCK_TESTDATA_CLEAN=$BASEDIR/../../plugin-twistlock/test/mock/twistlock-report-clean.json
ZAP_TESTDATA=$BASEDIR/../../plugin-zap/test/mock/zap-report.json

OWNER=
REPO=
SHA=
BRANCH=

while true; do
  case "$1" in
    -o | --owner ) OWNER="$2"; shift 2 ;;
    -r | --repo ) REPO="$2"; shift 2 ;;
    -s | --sha ) SHA="$2"; shift 2 ;;
    -b | --branch ) BRANCH="$2"; shift 2 ;;
    -- ) shift; break ;;
    * ) break ;;
  esac
done


QUERY_PARAMS="?org=$OWNER&repo=$REPO&sha=$SHA&branch=$BRANCH&uid=$BUILD_UUID"

echo "send nebula"
curl -H "Content-Type: application/json" -X POST -d "@$NEBULA_TESTDATA" http://$1/report/nebula$QUERY_PARAMS
echo

echo "send twistlock"
curl -H "Content-Type: application/json" -X POST -d "@$TWISTLOCK_TESTDATA_ALL" http://$1/report/twistlock$QUERY_PARAMS
echo
curl -H "Content-Type: application/json" -X POST -d "@$TWISTLOCK_TESTDATA_CLEAN" http://$1/report/twistlock$QUERY_PARAMS
echo

echo "send zap"
curl -H "Content-Type: application/json" -X POST -d "@$ZAP_TESTDATA" http://$1/report/zap$QUERY_PARAMS
echo
