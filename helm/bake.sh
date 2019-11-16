#!/bin/bash

BASEDIR=$(dirname "$0")
TEMP=`getopt -o vdm: --long gh-appid:,gh-keyfile: -- "$@"`

if [ $? != 0 ] ; then echo "missing arguments. terminating..." >&2 ; exit 1 ; fi

eval set -- "$TEMP"

GITHUB_KEYFILE=
GITHUB_APPID=

TARGET=$BASEDIR/swingletree-bake.yml

while true; do
  case "$1" in
    --gh-keyfile ) GITHUB_KEYFILE="$2"; shift 2 ;;
    --gh-appid ) GITHUB_APPID="$2"; shift 2 ;;
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

if [ -e $GITHUB_KEYFILE ]; then
  echo " > baking your manifest into $TARGET"
  helm template $BASEDIR/swingletree \
    --set swingletree.scotty.github.app.id=$GITHUB_APPID \
    --set-file github_app_key=$GITHUB_KEYFILE \
    > $TARGET
else
  echo " ! $GITHUB_KEYFILE does not exist"
  exit 1
fi