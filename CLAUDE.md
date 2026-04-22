# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Headlamp plugin for ArgoCD visibility. Monitors ArgoCD Applications, Rollouts, and health status via the ArgoCD REST API proxied through Kubernetes. Read-only — no cluster write operations.

- **Plugin name**: `argocd`
- **Target**: Headlamp >= v0.26
- **Data source**: ArgoCD server at `/api/v1/namespaces/argocd/services/argocd-server/proxy/api/v1/applications`
- **RBAC**: `get`/`list` on `services/proxy` for `argocd-server` in `argocd` namespace

## Commands

```bash
pnpm start          # dev server with hot reload
pnpm build          # production build
pnpm package        # package for headlamp
pnpm tsc            # TypeScript type check (no emit)
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm test           # vitest run
pnpm test:watch     # vitest watch mode
```

All tests and `pnpm tsc` must pass before committing.

## Architecture

```
src/
├── index.tsx                    # Plugin entry: registerRoute, registerSidebarEntry; ArgoCDErrorBoundary
├── test-utils.tsx               # Shared test fixtures
├── api/
│   └── argocd.ts                # ArgoCD API types (Application, ApplicationsList)
└── components/
    └── ApplicationsList.tsx     # ArgoCD Applications List view with health/sync badges and filters
```

## Code conventions

- Functional React components only — class components only for error boundaries (ArgoCDErrorBoundary in index.tsx)
- All imports from `@kinvolk/headlamp-plugin/lib` and `@kinvolk/headlamp-plugin/lib/CommonComponents`
- `@mui/material` is available as a shared external via Headlamp — use `useTheme` from `@mui/material/styles` for theming. Do NOT add `@mui/material` to package.json dependencies.
- Use `useTheme()` + `theme.palette.*` for all theme-aware colors — never use `var(--mui-palette-*)` CSS variables
- No other UI libraries (no Ant Design, etc.)
- TypeScript strict mode — no `any`, use `unknown` + type guards at API boundaries
- Context provider wraps each route component in `index.tsx`
- All registered components wrapped in `ArgoCDErrorBoundary` for graceful error handling
- Tests: vitest + @testing-library/react, mock with `vi.mock('@kinvolk/headlamp-plugin/lib', ...)`
- `vitest.setup.ts` provides a spec-compliant `localStorage` shim for Node 22+ compatibility

## Testing

Mock pattern for headlamp APIs:
```typescript
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn().mockResolvedValue({}) },
  K8s: { ResourceClasses: {} },
}));
```