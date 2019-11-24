#!/bin/bash

BASEDIR=$(dirname "$0")

BUILD_UUID=$(pwgen 20 1)

NEBULA_TESTDATA=$BASEDIR/../../plugin-nebula/test/mock/nebula/call.json
TWISTLOCK_TESTDATA_ALL=$BASEDIR/../../plugin-twistlock/test/mock/twistlock-report-all.json
TWISTLOCK_TESTDATA_CLEAN=$BASEDIR/../../plugin-twistlock/test/mock/twistlock-report-clean.json
ZAP_TESTDATA=$BASEDIR/../../plugin-zap/test/mock/zap-report.json

QUERY_PARAMS="?org=$1&repo=$2&sha=$3&branch=$3&uid=$BUILD_UUID"

#echo "send nebula"
#curl -H "Content-Type: application/json" -X POST -d "@$NEBULA_TESTDATA" http://localhost:3001/report/nebula$QUERY_PARAMS
#echo

echo "send twistlock"
curl -H "Content-Type: application/json" -X POST -d "@$TWISTLOCK_TESTDATA_ALL" http://localhost:3001/report/twistlock$QUERY_PARAMS
echo
curl -H "Content-Type: application/json" -X POST -d "@$TWISTLOCK_TESTDATA_CLEAN" http://localhost:3001/report/twistlock$QUERY_PARAMS
echo

echo "send zap"
curl -H "Content-Type: application/json" -X POST -d "@$ZAP_TESTDATA" http://localhost:3001/report/zap$QUERY_PARAMS
echo
