#!/bin/sh

INIT_KINTO_POD_STATUS=$(kubectl get pod egapro-init-kinto"$1")

# Check if egapro-init-kinto pod exists
if [ ! "$INIT_KINTO_POD_STATUS" ]
then
    kubectl apply -f k8s/kinto/pod-init-kinto-egapro.yml
else
    kubectl delete pod egapro-init-kinto"$1"
    kubectl apply -f k8s/kinto/pod-init-kinto-egapro.yml
fi

