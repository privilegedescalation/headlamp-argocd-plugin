import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import {
  Link,
  StatusLabel,
} from "@kinvolk/headlamp-plugin/lib/CommonComponents";
import React, { useEffect, useState } from "react";
import { ArgoCDApplication, ArgoCDApplicationsList } from "../api/argocd";
import { buildArgoCDProxyPath, useArgoCDConfig } from "../config";
import { syncStatusToColor } from "./ApplicationsList";

// --- API ---

async function fetchApplications(
  proxyPath: string
): Promise<ArgoCDApplicationsList> {
  const response = (await ApiProxy.request(
    proxyPath
  )) as ArgoCDApplicationsList;
  return response;
}

// --- Matching helper ---

/**
 * Returns ArgoCD applications that manage the given Deployment by matching
 * kind=Deployment and name in Application.status.resources[].
 */
export function appsForDeployment(
  apps: ArgoCDApplication[],
  deploymentName: string
): ArgoCDApplication[] {
  return apps.filter((app) =>
    (app.status?.resources ?? []).some(
      (res) => res.kind === "Deployment" && res.name === deploymentName
    )
  );
}

// --- Component ---

interface DeploymentArgoBadgeProps {
  deploymentName: string;
}

export default function DeploymentArgoBadge({
  deploymentName,
}: DeploymentArgoBadgeProps) {
  const getConfig = useArgoCDConfig();
  const proxyPath = buildArgoCDProxyPath(getConfig());
  const [apps, setApps] = useState<ArgoCDApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApplications(proxyPath)
      .then((data) => {
        if (cancelled) return;
        const matched = appsForDeployment(data.items ?? [], deploymentName);
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
  }, [deploymentName, proxyPath]);

  if (loading || error || !apps || apps.length === 0) {
    return null; // Show nothing when no matching application
  }

  const app = apps[0]; // Show first matching app
  const lastSynced = app.status?.history?.length
    ? app.status.history[app.status.history.length - 1]?.dexKey
    : null;
  const lastSyncedStr = lastSynced
    ? new Date(lastSynced).toLocaleString()
    : "—";

  return (
    <span>
      &nbsp;
      <Link to={`/argocd/applications/${app.metadata.name}`}>
        ArgoCD: {app.metadata.name}
      </Link>
      &nbsp;
      <StatusLabel
        status={syncStatusToColor(app.status?.sync?.status ?? "Unknown")}
      >
        {app.status?.sync?.status ?? "Unknown"}
      </StatusLabel>
      &nbsp;
      <span style={{ fontSize: "0.85em", opacity: 0.8 }}>
        Last sync: {lastSyncedStr}
      </span>
    </span>
  );
}
