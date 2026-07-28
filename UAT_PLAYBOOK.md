# UAT Playbook — ArgoCD Plugin

Test environment: https://headlamp-uat.animaniacs.farh.net

## Authentication (PRI-1951)

`headlamp-uat` requires sign-in before any step below can run. The login page (`/c/main/token`) offers two options:

- **Sign In (OIDC via authentik → Google)** — requires an interactive human account. Not usable by an automated UAT session.
- **Use A Token** — accepts a Kubernetes bearer token for the `animaniacs.farh.net` cluster.

For automated UAT sessions, use the dedicated `headlamp-uat-reader` ServiceAccount token:

- A short-lived (~1h) token is minted per-session and injected into the env var `HEADLAMP_UAT_READER_TOKEN`. Read it from the environment only — never hardcode, echo, log, or commit the value, matching the `.mcp.json` env-var pattern from PRI-1937.
- Paste the value of `$HEADLAMP_UAT_READER_TOKEN` into the "Use A Token" field and submit.
- If the env var is unset or empty, no credential has been injected for this session — stop and flag the blocker. Do not fall back to any other mounted ServiceAccount token (e.g. the agent's own `paperclip-app` token); that token belongs to a different cluster/namespace and pasting it here is an out-of-scope credential use.
- This token grants `get` on `services/proxy` (resourceNames `argocd-server` and `https:argocd-server:443`) and `get` on `services` (resourceName `argocd-server`), all in the `argocd` namespace only. For the `services/proxy` subresource, Kubernetes matches `resourceNames` against the literal path segment the plugin builds — `<scheme>:<service>:<port>`, i.e. `https:argocd-server:443` for the default config — so that scheme-qualified form must be present; the bare `argocd-server` is retained alongside it per the PRI-1956 dual-resourceName fix. See the `headlamp-uat-reader` Role/RoleBinding for the full grant (PRI-1951).
- **403 triage:** A 403 on the *configured* service proxy path (whichever namespace/service/port the test step targets) is a real failure — report it, do not mark it passing. A 403 on an unrelated cluster resource the plugin does not use (CRDs, node metrics, etc.) is an expected infrastructure gap and is not a plugin bug. **Note for steps 10–16:** those steps configure non-default targets (`cicd` namespace, `http:argo-argocd-server:80`); if the `headlamp-uat-reader` token is scoped only to `argocd/https:argocd-server:443`, those steps will also 403 — this is a token scope gap, not a plugin bug, but the configurability feature (PRI-1932) cannot be fully validated without a token that covers those targets.

## Prerequisites

- Headlamp UAT instance is accessible
- ArgoCD server is deployed in the `argocd` namespace (or configured namespace)
- Plugin is installed and enabled in Headlamp UAT
- Confirm the plugin build under test is deployed (`Settings → Plugins → argocd` lists the plugin version)
- Open the browser console (F12) — note any pre-existing errors before testing

## Test Steps

### Pre-flight: Fresh-install crash regression

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 0a | Clear any saved ArgoCD config: `Settings → Plugins → argocd` — delete the namespace value and save, or use a browser profile with no prior plugin state | Config cleared | |
| 0b | Navigate to `/c/main/argocd` (the ArgoCD Applications view) | Page renders without a blank screen or error boundary; browser console shows zero plugin-originating JS errors; network tab shows a request to `.../namespaces/argocd/services/...` (default namespace, not `.../namespaces/undefined/...`) | |

### Core functionality

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 1 | Navigate to ArgoCD → Applications | Applications list loads showing ArgoCD applications with health and sync status badges | |
| 2 | Verify health status badges | Each application row shows a health badge (Healthy/Degraded/Progressing/Missing/Unknown) | |
| 3 | Verify sync status badges | Each application row shows a sync badge (Synced/OutOfSync/Unknown) | |
| 4 | Use the filter controls | Filter by health or sync status narrows the list correctly | |
| 5 | Click an application row | Application detail or navigation loads without error | |

### Plugin settings — namespace

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 6 | Go to `Settings → Plugins → argocd` and set namespace to `argocd-prod`. Save. Navigate to `/c/main/argocd` and open the Network tab | Request path contains `/namespaces/argocd-prod/` (not `/namespaces/argocd/` or `/namespaces/undefined/`) | |
| 7 | Enter `  argocd-prod  ` (with leading/trailing spaces), save. Check network request | Request uses `/namespaces/argocd-prod/` (whitespace stripped) | |
| 8 | Navigate to any application detail page and a namespace detail page | All three views (list, detail, namespace page) use the same namespace in their network requests | |

### Plugin settings — non-standard ArgoCD installation

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 9 | Open `Settings → Plugins → argocd` | Settings panel shows four rows: "ArgoCD namespace", "ArgoCD service name", "ArgoCD service port", "ArgoCD service scheme" | |
| 10 | Change namespace to `cicd`, save | Applications list and detail views connect to ArgoCD in `cicd` namespace | |
| 11 | Change service name to `argo-argocd-server` (Helm install convention), save | Applications list loads using the renamed service; detail view also works | |
| 12 | Change service port to `80` and scheme to `http`, save | Proxy URL uses `http:argo-argocd-server:80`; list and detail views connect correctly | |
| 13 | Reset all settings to defaults (`argocd`, `argocd-server`, `443`, `https`), save | Plugin connects to standard ArgoCD installation again | |

### Consistency check

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| 14 | With non-standard service name configured, click an application in the list | Detail view loads using the same service-proxy path as the list (no CRD API fallback) | |
| 15 | Navigate to a Namespace page that has ArgoCD apps deployed to it | ArgoCD section shows matching apps using configured service name/port/scheme | |
| 16 | Navigate to a Deployment page managed by an ArgoCD app | ArgoCD badge appears with correct sync status, using configured settings | |

### Console error baseline

After all tests, review the console for plugin errors.

**Acceptable:** Infrastructure RBAC errors (e.g., 403 for CRD/node resources when the UAT service account lacks those permissions).

**Not acceptable:** Any `TypeError`, `ReferenceError`, or React error boundary triggered by the plugin code itself.

## Pass Criteria

- Applications list loads without errors with default settings
- Fresh-install renders a page (no crash, no `TypeError: Cannot read properties of undefined`)
- Health and sync status badges are visible on each row
- Filter controls function correctly
- Row click navigates to detail view without error
- All four settings fields (namespace, service name, port, scheme) are editable and persist
- Non-standard service name (`argo-argocd-server`) produces working list and detail views
- Non-standard port and scheme are reflected in the proxy path and produce working connections
- No hardcoded `argocd-server` or `argocd` namespace in any view
- Namespace input sanitisation strips whitespace

## Fail Criteria

- Page errors or blank screens
- Applications list empty when ArgoCD apps exist in the cluster
- Health/sync badges missing or all showing Unknown
- Filter controls unresponsive
- Settings changes do not affect the API path used
- Detail view uses a different path (CRD API) than the list view
- Settings panel missing any of the four configuration rows
- Plugin crashes on fresh install (no saved config)

## Artifacts to Capture

- Screenshot: Applications list with health and sync badges visible
- Screenshot: Filtered view (at least one filter applied)
- Screenshot: Settings panel showing all four configuration rows
- Screenshot: Applications list working with non-standard service name (`argo-argocd-server`)
- Screenshot: Network tab showing scheme-qualified proxy path (`https:argocd-server:443` or custom equivalent)
- Console errors (attach screenshot if any browser console errors observed)

## Sign-off

Record the Headlamp version, plugin version (from `artifacthub-pkg.yml`), and test environment URL in the UAT comment on the Paperclip issue.
