#!/bin/sh

INIT_KINTO_POD_STATUS=$(kubectl get job egapro-init-kinto"$1")

# Check if egapro-init-kinto job exists
if [ ! "$INIT_KINTO_POD_STATUS" ]
then
    kubectl apply -f k8s/kinto/job-init-kinto-egapro.yml
else
    kubectl delete job egapro-init-kinto"$1" -n "$2"
    kubectl apply -f k8s/kinto/job-init-kinto-egapro.yml
fi

