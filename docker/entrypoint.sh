echo "$GH_APP_PEM" > ./gh-app.pem

if [ -z ${CONFIG+x} ]; then
    echo "INFO: container swingletree configuration will be used"
else
    echo "INFO: using swingletree configuration from env var"
    printf $CONFIG > ./swingletree.conf.yaml
fi

node main.js $@
