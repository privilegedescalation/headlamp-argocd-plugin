import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import {
  Link,
  SectionBox,
  StatusLabel,
} from "@kinvolk/headlamp-plugin/lib/CommonComponents";
import React, { useEffect, useState } from "react";
import { ArgoCDApplication, ArgoCDApplicationsList } from "../api/argocd";
import {
  healthStatusToColor,
  healthStatusToLabel,
  syncStatusToColor,
} from "./ApplicationsList";

// --- API ---

const ARGOCD_API_PATH =
  "/api/v1/namespaces/argocd/services/argocd-server/proxy/api/v1/applications";

async function fetchApplications(): Promise<ArgoCDApplicationsList> {
  const response = (await ApiProxy.request(
    ARGOCD_API_PATH
  )) as ArgoCDApplicationsList;
  return response;
}

// --- Matching helper ---

/**
 * Returns ArgoCD applications whose spec.destination.namespace matches
 * the given namespace name.
 */
export function appsForNamespace(
  apps: ArgoCDApplication[],
  namespace: string
): ArgoCDApplication[] {
  return apps.filter((app) => app.spec?.destination?.namespace === namespace);
}

// --- Component ---

interface NamespaceArgoSectionProps {
  namespaceName: string;
}

export default function NamespaceArgoSection({
  namespaceName,
}: NamespaceArgoSectionProps) {
  const [apps, setApps] = useState<ArgoCDApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApplications()
      .then((data) => {
        if (cancelled) return;
        const matched = appsForNamespace(data.items ?? [], namespaceName);
        setApps(matched);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [namespaceName]);

  if (loading) {
    return (
      <SectionBox title="ArgoCD">
        <StatusLabel status="warning">Loading...</StatusLabel>
      </SectionBox>
    );
  }

  if (error || !apps) {
    return (
      <SectionBox title="ArgoCD">
        <StatusLabel status="error">ArgoCD unreachable</StatusLabel>
      </SectionBox>
    );
  }

  if (apps.length === 0) {
    return null; // Show nothing when no matching application
  }

  return (
    <SectionBox title="ArgoCD">
      <StatusLabel status="success">{apps.length} application(s)</StatusLabel>
      <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
        {apps.map((app) => (
          <li key={app.metadata.name} style={{ marginBottom: 8 }}>
            <Link to={`/argocd/applications/${app.metadata.name}`}>
              {app.metadata.name}
            </Link>
            &nbsp;
            <StatusLabel
              status={healthStatusToColor(
                app.status?.health?.status ?? "Unknown"
              )}
            >
              {healthStatusToLabel(app.status?.health?.status ?? "Unknown")}
            </StatusLabel>
            &nbsp;
            <StatusLabel
              status={syncStatusToColor(app.status?.sync?.status ?? "Unknown")}
            >
              {app.status?.sync?.status ?? "Unknown"}
            </StatusLabel>
          </li>
        ))}
      </ul>
    </SectionBox>
  );
}
