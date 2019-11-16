#!/bin/bash

set -e

BASEDIR=$(dirname "$0")
TEMP=`getopt -o h,n: --long namespace:,gh-appid:,configure,gh-keyfile:,help -- "$@"`

HELP="""
Swingletree HELM template bake utility

 This script supports you baking a swingletree manifest. You can customize the
 deployment by changing values in $BASEDIR/
 

 Options:
   --gh-keyfile       Path to the GitHub App private key file
   --gh-appid         GitHub App Id

   -n | --namespace   Sets the k8s target namespace

   --configure        Opens the values.yml in vi

"""

if [ $? != 0 ] ; then echo "missing arguments. terminating..." >&2 ; exit 1 ; fi

eval set -- "$TEMP"

GITHUB_KEYFILE=
GITHUB_APPID=
NAMESPACE=default

TARGET=$BASEDIR/swingletree-bake.yml

while true; do
  case "$1" in
    --gh-keyfile ) GITHUB_KEYFILE="$2"; shift 2 ;;
    --gh-appid ) GITHUB_APPID="$2"; shift 2 ;;
    -n | --namespace ) NAMESPACE="$2"; shift 2 ;;
    --configure ) vi $BASEDIR/swingletree/values.yaml; exit $?; shift ;;
    -h | --help ) echo "$HELP"; exit 0; shift ;;
    -- ) shift; break ;;
    * ) break ;;
  esac
done

if [ -z $GITHUB_APPID ]; then
  echo " ! option --gh-appid is missing"
  exit 1
fi

if [ -z $GITHUB_KEYFILE ]; then
  echo " ! option --gh-keyfile is missing"
  exit 1
fi

echo

if [ -e $GITHUB_KEYFILE ]; then
  echo " > baking your manifest into $TARGET"
  helm template $BASEDIR/swingletree \
    -n $NAMESPACE \
    --set github.app.id=$GITHUB_APPID \
    --set-file github_app_key=$GITHUB_KEYFILE \
    > $TARGET
else
  echo " ! $GITHUB_KEYFILE does not exist"
  exit 1
fi

echo
echo "============================================================"
echo " Your manifest is ready for deployment. Deploy it using:"
echo
echo " kubectl apply -f $TARGET"
echo "============================================================"
echo
