---
title: Kubernetes
permalink: /docs/install/k8s/
redirect_from: /docs/index.html
---

This section covers the installation of an on-premise Swingletree on a Kubernetes cluster.

Swingletree is a composite of services. It is recommended to use the helm chart provided with Swingletree to perform your installation.

### Swingletree Configuration

1. Clone the [Swingletree Management Repository](https://github.com/swingletree-oss/swingletree)
2. Configure your values in [helm/swingletree/values.yaml][helm-values]. You will find comments describing the values in the file.
3. Bake your manifest using `helm/bake.sh`

### Deployment

Run `kubectl apply -f [deployment manifest]` to deploy Swingletree to your cluster.


[helm-values]: https://github.com/swingletree-oss/swingletree/blob/master/helm/swingletree/values.yaml
