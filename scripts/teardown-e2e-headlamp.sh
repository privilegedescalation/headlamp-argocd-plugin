#!/usr/bin/env bash
set -euo pipefail

E2E_NAMESPACE="${E2E_NAMESPACE:-headlamp-dev}"
E2E_RELEASE="${E2E_RELEASE:-headlamp-e2e-argocd}"

echo "=== E2E Teardown ==="
echo "  Namespace: $E2E_NAMESPACE"
echo "  Release:   $E2E_RELEASE"

kubectl delete deployment "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found || true
kubectl delete service "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found || true
kubectl delete serviceaccount "${E2E_RELEASE}" -n "$E2E_NAMESPACE" --ignore-not-found || true
kubectl delete serviceaccount headlamp-e2e-test -n "$E2E_NAMESPACE" --ignore-not-found || true
kubectl delete configmap headlamp-argocd-plugin -n "$E2E_NAMESPACE" --ignore-not-found || true

echo "Teardown complete."