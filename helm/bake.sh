#!/bin/bash

set -e

BASEDIR=$(dirname "$0")
CHART=swingletree
VALUES_CONFIG=$BASEDIR/$CHART/values.yaml

HELP="""
Swingletree HELM template bake utility

 This script supports you baking a swingletree manifest. You can customize the
 deployment by changing values in $VALUES_CONFIG

 Options:
   --gh-keyfile         Path to the GitHub App private key file
   --gh-appid           GitHub App Id
   --redis-password     Ask for redis password and set it. Omitting this will generate a password.

   -n | --namespace     Sets the k8s target namespace

   --configure          Opens the template values.yaml in vi

   -k | --skip-update   Skips the HELM chart update

"""

TEMP=`getopt -o h,k,n: --long namespace:,gh-appid:,redis-password,configure,skip-update,gh-keyfile:,help -- "$@"`

function printHelp {
  echo "$HELP"  
}

function applyTemplate {
  if [ $SKIP_UPDATE -eq 0 ]; then
    echo " >> Updating Chart dependencies. You can skip this by using -k flag."
    echo "-------------------------------------------------- "
    helm dependency update $CHART
    echo "-------------------------------------------------- "
    echo
  fi
  echo " > baking your manifest into $TARGET"
  helm template $BASEDIR/swingletree \
    -n $NAMESPACE \
    --set github.app.id=$GITHUB_APPID \
    --set redis.password=$REDIS_PASS \
    --set-file github_app_key=$GITHUB_KEYFILE \
    > $TARGET
}

if [ $? != 0 ] ; then echo "missing arguments. terminating..." >&2 ; exit 1 ; fi

eval set -- "$TEMP"

GITHUB_KEYFILE=
GITHUB_APPID=
NAMESPACE=default
SKIP_UPDATE=0
REDIS_PASS=$(pwgen 20 1)
echo $REDIS_PASS

TARGET=$BASEDIR/swingletree-bake.yml

while true; do
  case "$1" in
    --gh-keyfile ) GITHUB_KEYFILE="$2"; shift 2 ;;
    --gh-appid ) GITHUB_APPID="$2"; shift 2 ;;
    -n | --namespace ) NAMESPACE="$2"; shift 2 ;;
    --configure ) vi $VALUES_CONFIG; exit $?; shift ;;
    -k | --skip-update ) SKIP_UPDATE=1; shift ;;
    --redis-password ) REDIS_PASS=$(read -sp " > set redis password: "); shift ;;
    -h | --help ) printHelp; exit 0; shift ;;
    -- ) shift; break ;;
    * ) break ;;
  esac
done

MISSING_OPTS=0

if [ -z $GITHUB_APPID ]; then
  echo " ! option --gh-appid is missing"
  MISSING_OPTS=1
fi

if [ -z $GITHUB_KEYFILE ]; then
  echo " ! option --gh-keyfile is missing"
  MISSING_OPTS=1
fi

if [ $MISSING_OPTS -gt 0 ]; then
  printHelp
  exit 1
fi

echo

if [ -e $GITHUB_KEYFILE ]; then
  applyTemplate
else
  echo " ! $GITHUB_KEYFILE does not exist"
  exit 1
fi

echo
echo "============================================================"
echo " Your manifest is ready for deployment. Deploy it using:"
echo
echo " kubectl apply --namespace $NAMESPACE -f $TARGET"
echo "============================================================"
echo
