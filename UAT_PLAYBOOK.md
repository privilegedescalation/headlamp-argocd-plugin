# UAT Playbook — ArgoCD Plugin

## Access

**Sidebar → ArgoCD section**

## Prerequisites

- Headlamp UAT instance is accessible
- ArgoCD server is deployed in the `argocd` namespace (or configured namespace)
- Plugin is installed and enabled in Headlamp UAT

## Test Steps

### Core functionality

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 1 | Navigate to ArgoCD → Applications | Applications list loads showing ArgoCD applications with health and sync status badges | |
| 2 | Verify health status badges | Each application row shows a health badge (Healthy/Degraded/Progressing/Missing/Unknown) | |
| 3 | Verify sync status badges | Each application row shows a sync badge (Synced/OutOfSync/Unknown) | |
| 4 | Use the filter controls | Filter by health or sync status narrows the list correctly | |
| 5 | Click an application row | Application detail or navigation loads without error | |

### Plugin settings — non-standard ArgoCD installation

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 6 | Open Headlamp Settings → Plugins → ArgoCD | Settings panel shows four rows: "ArgoCD namespace", "ArgoCD service name", "ArgoCD service port", "ArgoCD service scheme" | |
| 7 | Change namespace to `cicd`, save | Applications list and detail views connect to ArgoCD in `cicd` namespace | |
| 8 | Change service name to `argo-argocd-server` (Helm install convention), save | Applications list loads using the renamed service; detail view also works | |
| 9 | Change service port to `80` and scheme to `http`, save | Proxy URL uses `http:argo-argocd-server:80`; list and detail views connect correctly | |
| 10 | Reset all settings to defaults (`argocd`, `argocd-server`, `443`, `https`), save | Plugin connects to standard ArgoCD installation again | |

### Consistency check

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 11 | With non-standard service name configured, click an application in the list | Detail view loads using the same service-proxy path as the list (no CRD API fallback) | |
| 12 | Navigate to a Namespace page that has ArgoCD apps deployed to it | ArgoCD section shows matching apps using configured service name/port/scheme | |
| 13 | Navigate to a Deployment page managed by an ArgoCD app | ArgoCD badge appears with correct sync status, using configured settings | |

## Pass Criteria

- Applications list loads without errors with default settings
- Health and sync status badges are visible on each row
- Filter controls function correctly
- Row click navigates to detail view without error
- All four settings fields (namespace, service name, port, scheme) are editable and persist
- Non-standard service name (`argo-argocd-server`) produces working list and detail views
- Non-standard port and scheme are reflected in the proxy path and produce working connections
- No hardcoded `argocd-server` or `argocd` namespace in any view

## Fail Criteria

- Page errors or blank screens
- Applications list empty when ArgoCD apps exist in the cluster
- Health/sync badges missing or all showing Unknown
- Filter controls unresponsive
- Settings changes do not affect the API path used
- Detail view uses a different path (CRD API) than the list view
- Settings panel missing any of the four configuration rows

## Artifacts to Capture

- Screenshot: Applications list with health and sync badges visible
- Screenshot: Filtered view (at least one filter applied)
- Screenshot: Settings panel showing all four configuration rows
- Screenshot: Applications list working with non-standard service name (`argo-argocd-server`)
- Console errors (attach screenshot if any browser console errors observed)
