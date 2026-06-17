# UAT Playbook — headlamp-argocd-plugin

Test environment: https://headlamp-uat.animaniacs.farh.net

## Pre-flight

1. Confirm the plugin build under test is deployed (`Settings → Plugins → argocd` lists the plugin version).
2. Open the browser console (F12) — note any pre-existing errors before testing.

## Test cases

### 1. Fresh-install crash regression

**Objective:** Verify the plugin does not crash when no namespace has been saved (fresh install / cleared config).

**Setup:** Clear any saved ArgoCD config: `Settings → Plugins → argocd` — delete the namespace value and save, or use a browser profile with no prior plugin state.

**Steps:**
1. Navigate to `/c/main/argocd` (the ArgoCD Applications view).
2. Observe the page renders without a blank screen or error boundary.

**Pass criteria:**
- Page renders (even if ArgoCD is not installed — an empty state or error message is acceptable).
- Browser console shows **zero** plugin-originating JS errors (no `TypeError: Cannot read properties of undefined`).
- Network tab shows a request to `.../namespaces/argocd/services/argocd-server/...` (default namespace, not `.../namespaces/undefined/...`).

---

### 2. Default namespace fallback

**Objective:** Confirm that with no saved config the plugin uses `argocd` as the namespace.

**Steps:**
1. Ensure no namespace is saved (see Setup in Test 1).
2. Navigate to `/c/main/argocd`.
3. Open the Network tab and filter for `argocd-server`.

**Pass criteria:**
- Request path contains `/namespaces/argocd/` (not `/namespaces/undefined/`).

---

### 3. Custom namespace round-trip

**Objective:** Verify a configured namespace is used in all plugin views.

**Steps:**
1. Go to `Settings → Plugins → argocd` and set namespace to `argocd-prod`. Save.
2. Navigate to `/c/main/argocd` (ApplicationsList).
3. Navigate to any application detail page.
4. Check a namespace detail page (sidebar → Namespaces → any namespace).

**Pass criteria:**
- Network requests use `/namespaces/argocd-prod/` in all three views.
- No JS errors in console.

---

### 4. Namespace input sanitisation

**Objective:** Confirm leading/trailing whitespace is stripped on save.

**Steps:**
1. Go to `Settings → Plugins → argocd`.
2. Enter `  argocd-prod  ` (with leading and trailing spaces). Save.
3. Navigate to `/c/main/argocd`.

**Pass criteria:**
- Network request uses `/namespaces/argocd-prod/` (not `/namespaces/%20%20argocd-prod%20%20/`).

---

### 5. ApplicationsList renders

**Objective:** Basic smoke test — the Applications list view loads.

**Steps:**
1. Navigate to `/c/main/argocd`.
2. Wait for the page to finish loading.

**Pass criteria:**
- Either a table of applications or an "ArgoCD not found" / empty-state message is rendered.
- No unhandled React error boundary is shown.
- Zero plugin JS errors in console.

---

### 6. Console error baseline

After all tests, review the console for plugin errors.

**Acceptable:** Infrastructure RBAC errors (e.g., 403 for CRD/node resources when the UAT service account lacks those permissions).

**Not acceptable:** Any `TypeError`, `ReferenceError`, or React error boundary triggered by the plugin code itself.

---

## Sign-off

Record the Headlamp version, plugin version (from `artifacthub-pkg.yml`), and test environment URL in the UAT comment on the Paperclip issue.
