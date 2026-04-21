import {
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import {
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';

// --- Error boundary for plugin components ---

interface ErrorBoundaryState {
  error: string | null;
}

class ArgoCDErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <SectionBox title="ArgoCD Plugin Error">
          <StatusLabel status="error">{this.state.error}</StatusLabel>
        </SectionBox>
      );
    }
    return this.props.children;
  }
}

// --- Stub Applications List View ---

function ArgoCDStubView() {
  return (
    <SectionBox title="ArgoCD Applications">
      <StatusLabel status="info">
        Plugin scaffold — features coming soon.
      </StatusLabel>
    </SectionBox>
  );
}

// --- Sidebar entry ---

registerSidebarEntry({
  parent: null,
  name: 'argocd',
  label: 'ArgoCD',
  url: '/argocd',
  icon: 'mdi:git',
});

registerSidebarEntry({
  parent: 'argocd',
  name: 'argocd-overview',
  label: 'Applications',
  url: '/argocd',
  icon: 'mdi:view-list',
});

// --- Routes ---

registerRoute({
  path: '/argocd',
  sidebar: 'argocd-overview',
  name: 'argocd',
  exact: true,
  component: () => (
    <ArgoCDErrorBoundary>
      <ArgoCDStubView />
    </ArgoCDErrorBoundary>
  ),
});
