---
title: Kubernetes
permalink: /docs/install/k8s/
redirect_from: /docs/index.html
---

This section covers the installation of an on-premise Swingletree on a Kubernetes cluster.
Swingletree is a composite of services. It is recommended to use the helm chart provided with Swingletree to perform your installation.

> You will need [helm](https://helm.sh/) installed to configure the HELM chart.

### Swingletree Configuration

Swingletree is configured by setting values in a HELM `values.yaml`. Documentation for the properties is directy
put into the [values.yaml][helm-values]. Make sure you have selected the release-tag according to your version when viewing
or downloading the `values.yaml` in GitHub.

#### Custom CA

`bake.sh` provides an option to add a certificate authority (CA). The services of Swingletree will trust the given CA when provided.

Concatenate the CA certificates (base64 encoded, e.g. pem) in one file and pass the contents of the file to `bake.sh` or helm.

#### Private Registries

Some registries (like GitHub packages) allow only authenticated users to pull images. Kubernetes can handle this for you by providing an [Image Pull Secret][image-pull-secret]. `values.yaml` provides a configuration option (`imagePullSecret`) to set the secret id to use when pulling Swingletree images.


### Deploying Swingletree

Swingletree is installed by using a HELM chart. Each [Swingletree release][releases] in the management repository has a packaged HELM chart attached
to the release since `3.2.0`. Some values of the template need to be set by you.

There are two options:

* Use the packaged helm template and pass your configuration values
* Use the management repository source and `bake.sh`

#### Use packaged helm template

1. Navigate to the [Swingletree Releases page][releases] and download the packaged HELM chart attached as an asset to the release
2. Configure the values of the `values.yaml`
  * Set file-based values, like `github.app.keyfile` or `certificates.ca.value`, when invoking helm using the `--set-file` argument.
3. Deploy Swingletree using HELM

#### Bake template from source

1. Clone the [Swingletree Management Repository](https://github.com/swingletree-oss/swingletree)
2. Configure your values in [helm/swingletree/values.yaml][helm-values]. You will find comments describing the values in the file.
3. Bake your manifest using `helm/bake.sh`. Print help using `./bake.sh -h`.
4. Deploy your generated manifest with the command provided in the stdout of `bake.sh` (using kubectl)


[helm-values]: https://github.com/swingletree-oss/swingletree/blob/master/helm/swingletree/values.yaml
[image-pull-secret]: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/
[releases]: https://github.com/swingletree-oss/swingletree/releases
