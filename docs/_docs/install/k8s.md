---
title: Kubernetes
permalink: /docs/install/k8s/
redirect_from: /docs/index.html
---

This section covers the installation of an on-premise Swingletree on a Kubernetes cluster.

Swingletree is a composite of services. It is recommended to use the helm chart provided with Swingletree to perform your installation.

### Installation Dependencies

You will need [helm](https://helm.sh/) to bake your Swingletree deployment manifest using `bake.sh`.

### Swingletree Configuration

1. Clone the [Swingletree Management Repository](https://github.com/swingletree-oss/swingletree)
2. Configure your values in [helm/swingletree/values.yaml][helm-values]. You will find comments describing the values in the file.
3. Bake your manifest using `helm/bake.sh`. Print help using `./bake.sh -h`.

#### Custom CA

`bake.sh` provides an option to add a certificate authority (CA). The services of swingletree will trust the given CA when provided.

#### Private Registries

Some registries (like GitHub packages) allow only authenticated users to pull images. Kubernetes can handle this for you by providing an [Image Pull Secret][image-pull-secret]. `values.yaml` provides a configuration option (`imagePullSecret`) to set the secret id to use when pulling Swingletree images.

### Deployment

Run `kubectl apply -n [namespace] -f [deployment manifest]` to deploy Swingletree to your cluster.


[helm-values]: https://github.com/swingletree-oss/swingletree/blob/master/helm/swingletree/values.yaml
[image-pull-secret]: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/
