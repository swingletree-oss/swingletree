---
title: Docker Compose
permalink: /docs/install/compose/
redirect_from: /docs/index.html
---

<div class="well well-sm">
Kubernetes is recommended to host your Swingletree installation. Docker Compose can be used to quickly set up a Swingletree instance for evaluation purposes. 
</div>

This section covers the installation of an on-premise Swingletree using `docker-compose`


#### Custom CA

In case you need to use a custom certificate authority mount the certificate in `pem` format into the containers and define the environment variable `NODE_EXTRA_CA_CERTS` with the absolute path of the file inside the container.

```yaml
# docker-compose.yml
[ ... ]
  # example for scotty
  scotty:
    container_name: scotty
    env_file: 
      - ./compose.env
    environment:
      NODE_EXTRA_CA_CERTS: /opt/cert/ca.pem # reference extra ca certs file to nodejs
    image: docker.pkg.github.com/swingletree-oss/scotty/scotty:VERSION
    restart: always
    volumes:
      - ./swingletree.conf.yaml:/opt/scotty/swingletree.conf.yaml
      - ./ca.pem:/opt/cert/ca.pem # mount certificate
    expose:
      - "3000"
[ ... ]
```

#### GitHub Packages Docker Registry

Some registries (like GitHub packages) allow only authenticated users to pull images. You will need to authenticate via `docker login docker.pkg.github.com`
before pulling images. See [GitHub Packages Docs](https://docs.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-docker-for-use-with-github-packages)
in case you require more information.

### Deploying Swingletree

Clone the [Swingletree Management Repository][mgmt] and switch to the directory `compose`. You will find 
a `README.md` describing the next steps for the version you checked out.

[mgmt]: https://github.com/swingletree-oss/swingletree/
