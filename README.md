# headlamp-argocd

A [Headlamp](https://headlamp.dev) plugin for ArgoCD visibility.

Monitors ArgoCD Applications, Rollouts, and health status. Read-only — no cluster write operations.

## Installation

Install via Headlamp's built-in plugin installer (ArtifactHub):

```bash
# Install from Headlamp UI → Settings → Plugins → Add plugin
# Search for "argocd" or paste the ArtifactHub URL
```

## Configuration

After installation, configure the plugin via **Settings → Plugins → argocd**:

- **ArgoCD namespace** — the Kubernetes namespace where the ArgoCD server is
  installed. Defaults to `argocd`. The plugin proxies the ArgoCD REST API
  through the `argocd-server` Service in this namespace, so this must match
  the namespace ArgoCD is deployed in.

### RBAC

The plugin requires `get`/`list` on `services/proxy` for the
`argocd-server` Service in the **configured** namespace. For the default
`argocd` namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: headlamp-argocd-reader
rules:
  - apiGroups: [""]
    resources: ["services/proxy"]
    resourceNames: ["argocd-server"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["services"]
    resourceNames: ["argocd-server"]
    verbs: ["get"]
```

If you configure a non-default namespace, update the
`resourceNames`/`namespace` selectors or grant access cluster-wide.

## Development

```bash
npm install
npm run build
npm test
```

## Release

Releases are automated via the GitHub Actions release workflow:

```bash
gh workflow run Release --field version=0.1.0
```

## License

Apache-2.0

