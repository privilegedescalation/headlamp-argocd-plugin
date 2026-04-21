/**
 * Page injection registrations for ArgoCD plugin.
 * Registers detail view sections on Namespace and Deployment pages.
 */
import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import { KubeObject } from "@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject";
import { registerDetailsViewSection } from "@kinvolk/headlamp-plugin/lib";
import {
  SectionBox,
  StatusLabel,
} from "@kinvolk/headlamp-plugin/lib/CommonComponents";
import { Link } from "react-router-dom";
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

// --- Namespace section ---

function NamespaceArgoSection({ resource }: { resource: KubeObject }) {
  const namespaceName = resource.metadata.name;
  const [apps, setApps] = useState<ArgoCDApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApplications()
      .then((data) => {
        if (cancelled) return;
        const matched = (data.items ?? []).filter(
          (app) => app.spec?.destination?.namespace === namespaceName
        );
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
    return null;
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
                (app.status?.health?.status as
                  | "Healthy"
                  | "Degraded"
                  | "Progressing"
                  | "Missing"
                  | "Unknown") ?? "Unknown"
              )}
            >
              {healthStatusToLabel(
                (app.status?.health?.status as
                  | "Healthy"
                  | "Degraded"
                  | "Progressing"
                  | "Missing"
                  | "Unknown") ?? "Unknown"
              )}
            </StatusLabel>
            &nbsp;
            <StatusLabel
              status={syncStatusToColor(
                (app.status?.sync?.status as
                  | "Synced"
                  | "OutOfSync"
                  | "Unknown") ?? "Unknown"
              )}
            >
              {app.status?.sync?.status ?? "Unknown"}
            </StatusLabel>
          </li>
        ))}
      </ul>
    </SectionBox>
  );
}

// --- Deployment badge ---

function DeploymentArgoBadge({ resource }: { resource: KubeObject }) {
  const deploymentName = resource.metadata.name;
  const [apps, setApps] = useState<ArgoCDApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApplications()
      .then((data) => {
        if (cancelled) return;
        const matched = (data.items ?? []).filter((app) =>
          (app.status?.resources ?? []).some(
            (res) => res.kind === "Deployment" && res.name === deploymentName
          )
        );
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
  }, [deploymentName]);

  if (loading || error || !apps || apps.length === 0) {
    return null;
  }

  const app = apps[0];
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
        status={syncStatusToColor(
          (app.status?.sync?.status as "Synced" | "OutOfSync" | "Unknown") ??
            "Unknown"
        )}
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

// --- Registration ---

registerDetailsViewSection(({ resource }: { resource: KubeObject }) => {
  if (resource.kind === "Namespace") {
    return <NamespaceArgoSection resource={resource} />;
  }

  if (resource.kind === "Deployment") {
    return <DeploymentArgoBadge resource={resource} />;
  }

  return null;
});
