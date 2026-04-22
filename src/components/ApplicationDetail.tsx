import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import {
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from "@kinvolk/headlamp-plugin/lib/CommonComponents";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArgoCDApplication,
  ArgoCDHealthStatus,
  ArgoCDSyncStatus,
} from "../api/argocd";
import { healthStatusToColor, syncStatusToColor } from "./ApplicationsList";

// --- Types ---

interface ResourceRow {
  kind: string;
  name: string;
  namespace: string;
  healthStatus: ArgoCDHealthStatus | "Unknown";
  syncStatus: ArgoCDSyncStatus | "Unknown";
}

interface SyncHistoryRow {
  revision: string;
  deployedAt: string;
  initiatedBy: string;
  status: "Success" | "Failed" | "Unknown";
}

interface K8sEvent {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
  };
  type: string;
  reason: string;
  message: string;
  involvedObject: {
    name: string;
    kind: string;
  };
  source: {
    component: string;
  };
}

// --- Helpers ---

function healthStatusToLabel(status: ArgoCDHealthStatus | "Unknown"): string {
  return status === "Unknown" ? "Unknown" : status;
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  } catch {
    return "—";
  }
}

function formatRevision(revision: string): string {
  if (!revision) return "—";
  if (revision.length <= 8) return revision;
  return revision.slice(0, 8);
}

// --- API ---

const ARGOCD_API_PATH =
  "/api/v1/namespaces/argocd/services/argocd-server/proxy/api/v1/applications";

async function fetchApplication(
  name: string
): Promise<ArgoCDApplication | null> {
  try {
    const response = (await ApiProxy.request(
      `${ARGOCD_API_PATH}/${name}`
    )) as ArgoCDApplication;
    return response;
  } catch {
    return null;
  }
}

async function fetchApplicationEvents(
  namespace: string,
  appName: string
): Promise<K8sEvent[]> {
  try {
    const fieldSelector = encodeURIComponent(`involvedObject.name=${appName}`);
    const response = (await ApiProxy.request(
      `/api/v1/namespaces/${namespace}/events?fieldSelector=${fieldSelector}`
    )) as { items: K8sEvent[] };
    return response.items ?? [];
  } catch {
    return [];
  }
}

// --- Component ---

export default function ApplicationDetail() {
  const { name } = useParams<{ name: string }>();
  const [application, setApplication] = useState<ArgoCDApplication | null>(
    null
  );
  const [events, setEvents] = useState<K8sEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchApplication(name)
      .then((app) => {
        if (cancelled) return;
        if (!app) {
          setError("Application not found");
          setLoading(false);
          return;
        }
        setApplication(app);
        setLoading(false);

        // Fetch events in parallel
        const namespace = app.metadata?.namespace ?? "argocd";
        fetchApplicationEvents(namespace, name).then((evts) => {
          if (!cancelled) setEvents(evts);
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  if (loading) {
    return (
      <>
        <SectionHeader title="Application Detail" />
        <SectionBox>
          <div data-testid="application-detail-loading">
            Loading application details...
          </div>
        </SectionBox>
      </>
    );
  }

  if (error || !application) {
    return (
      <>
        <SectionHeader title="Application Detail" />
        <SectionBox>
          <div data-testid="application-detail-error">
            <StatusLabel status="error">
              {error ?? "Application not found"}
            </StatusLabel>
          </div>
        </SectionBox>
      </>
    );
  }

  const healthStatus =
    (application.status?.health?.status as ArgoCDHealthStatus) ?? "Unknown";
  const syncStatus =
    (application.status?.sync?.status as ArgoCDSyncStatus) ?? "Unknown";
  const targetRevision = application.spec?.targetRevision ?? "—";
  const repoURL = application.spec?.sourceRepoURL ?? "—";
  const project = application.spec?.project ?? "—";
  const namespace = application.metadata?.namespace ?? "—";

  // Build resource rows
  const resourceRows: ResourceRow[] = (application.status?.resources ?? []).map(
    (res) => ({
      kind: res.kind ?? "Unknown",
      name: res.name ?? "unknown",
      namespace: res.namespace ?? "—",
      healthStatus: (res.health?.status as ArgoCDHealthStatus) ?? "Unknown",
      syncStatus: (res.status as ArgoCDSyncStatus) ?? "Unknown",
    })
  );

  // Build sync history rows (last 10)
  const historyRows: SyncHistoryRow[] = (application.status?.history ?? [])
    .slice(-10)
    .map((entry) => ({
      revision: formatRevision(entry.revision),
      deployedAt: formatTimestamp(entry.dexKey),
      initiatedBy: entry.triggeredBy ?? "automated",
      status: entry.id !== undefined ? "Success" : "Unknown",
    }));

  const resourceColumns = [
    {
      label: "Kind",
      getter: (row: ResourceRow) => row.kind,
    },
    {
      label: "Name",
      getter: (row: ResourceRow) => row.name,
    },
    {
      label: "Namespace",
      getter: (row: ResourceRow) => row.namespace,
    },
    {
      label: "Health",
      getter: (row: ResourceRow) => (
        <StatusLabel status={healthStatusToColor(row.healthStatus)}>
          {healthStatusToLabel(row.healthStatus)}
        </StatusLabel>
      ),
    },
    {
      label: "Sync",
      getter: (row: ResourceRow) => (
        <StatusLabel status={syncStatusToColor(row.syncStatus)}>
          {row.syncStatus}
        </StatusLabel>
      ),
    },
  ];

  const historyColumns = [
    {
      label: "Revision",
      getter: (row: SyncHistoryRow) => row.revision,
    },
    {
      label: "Deployed At",
      getter: (row: SyncHistoryRow) => row.deployedAt,
    },
    {
      label: "Initiated By",
      getter: (row: SyncHistoryRow) => row.initiatedBy,
    },
    {
      label: "Status",
      getter: (row: SyncHistoryRow) => (
        <StatusLabel status={row.status === "Success" ? "success" : "warning"}>
          {row.status}
        </StatusLabel>
      ),
    },
  ];

  return (
    <>
      <SectionHeader title={`ArgoCD — ${name}`} />
      <SectionBox>
        {/* Header metadata */}
        <div data-testid="application-detail-header">
          <StatusLabel status={healthStatusToColor(healthStatus)}>
            {healthStatusToLabel(healthStatus)}
          </StatusLabel>{" "}
          <StatusLabel status={syncStatusToColor(syncStatus)}>
            {syncStatus}
          </StatusLabel>
          <table>
            <tbody>
              <tr>
                <td>
                  <strong>Project:</strong>
                </td>
                <td>{project}</td>
              </tr>
              <tr>
                <td>
                  <strong>Namespace:</strong>
                </td>
                <td>{namespace}</td>
              </tr>
              <tr>
                <td>
                  <strong>Target Revision:</strong>
                </td>
                <td>{targetRevision}</td>
              </tr>
              <tr>
                <td>
                  <strong>Repository:</strong>
                </td>
                <td>{repoURL}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionBox>

      {/* Resource Tree */}
      <SectionBox title="Resource Tree">
        {resourceRows.length === 0 ? (
          <div data-testid="resource-tree-empty">
            No resources managed by this application.
          </div>
        ) : (
          <SimpleTable
            columns={resourceColumns}
            data={resourceRows}
            emptyMessage="No resources found."
          />
        )}
      </SectionBox>

      {/* Sync History */}
      <SectionBox title="Sync History">
        {historyRows.length === 0 ? (
          <div data-testid="sync-history-empty">No sync history available.</div>
        ) : (
          <SimpleTable
            columns={historyColumns}
            data={historyRows}
            emptyMessage="No sync history found."
          />
        )}
      </SectionBox>

      {/* Events */}
      <SectionBox title="Events">
        {events.length === 0 ? (
          <div data-testid="events-empty">
            No events found for this application.
          </div>
        ) : (
          <SimpleTable
            columns={[
              {
                label: "Type",
                getter: (row: K8sEvent) => row.type,
              },
              {
                label: "Reason",
                getter: (row: K8sEvent) => row.reason,
              },
              {
                label: "Message",
                getter: (row: K8sEvent) => row.message,
              },
              {
                label: "Source",
                getter: (row: K8sEvent) => row.source?.component ?? "—",
              },
              {
                label: "Age",
                getter: (row: K8sEvent) =>
                  formatTimestamp(row.metadata?.creationTimestamp ?? ""),
              },
            ]}
            data={events}
            emptyMessage="No events found."
          />
        )}
      </SectionBox>
    </>
  );
}
