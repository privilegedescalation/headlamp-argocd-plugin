# headlamp-argocd

> [!WARNING]
> **This plugin is deprecated and no longer maintained.** This repository is
> being archived and will receive no further updates or fixes.
>
> Please use the official Argo CD plugin for Headlamp instead:
>
> - Artifact Hub: <https://artifacthub.io/packages/headlamp/headlamp-plugins/headlamp_argocd>
> - Source: <https://github.com/headlamp-k8s/plugins/tree/main/argocd>

A [Headlamp](https://headlamp.dev) plugin for ArgoCD visibility.

Monitors ArgoCD Applications, Rollouts, and health status. Read-only — no cluster write operations.

## Installation

Install via Headlamp's built-in plugin installer (ArtifactHub):

```bash
# Install from Headlamp UI → Settings → Plugins → Add plugin
# Search for "argocd" or paste the ArtifactHub URL
```

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

