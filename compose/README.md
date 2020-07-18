# Docker compose installation

Installation via docker compose is not recommended for production environments. Please use this only for evaluation purposes.

If you are looking for a development setup see `/compose/dev/`.

## Configuration

Configuration is performed by editing the `swingletree.conf.yaml` inside this directory and running `docker-compose up` on the host. Visit the repositories of the components for documentation regarding the configuration file.

Some settings need to be adjusted inside `docker-compose.yml` watch for comments inside this file.

### Custom CA

In case you need to use a custom certificate authority, mount the certificate in `pem` format into the containers and define the Environment Variable `NODE_EXTRA_CA_CERTS` with the absolute path of the file inside the container.

## Issues

Please contact the maintainers in case you encounter issues using this approach via GitHub Issues.