import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import {
  SectionBox,
  SectionHeader,
  SimpleTable,
  StatusLabel,
} from "@kinvolk/headlamp-plugin/lib/CommonComponents";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArgoCDApplication, ArgoCDApplicationsList } from "../api/argocd";

// --- Types ---

export type HealthStatus =
  | "Healthy"
  | "Degraded"
  | "Progressing"
  | "Missing"
  | "Unknown";
export type SyncStatus = "Synced" | "OutOfSync" | "Unknown";

export interface ApplicationRow {
  name: string;
  namespace: string;
  project: string;
  healthStatus: HealthStatus;
  syncStatus: SyncStatus;
  targetRevision: string;
  lastSynced: string | null;
}

// --- Helpers ---

export function healthStatusToLabel(status: HealthStatus): string {
  return status;
}

export function healthStatusToColor(
  status: HealthStatus
): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "Healthy":
      return "success";
    case "Degraded":
      return "error";
    case "Progressing":
      return "warning";
    case "Missing":
    case "Unknown":
      return "default";
  }
}

export function syncStatusToColor(
  status: SyncStatus
): "success" | "warning" | "default" {
  switch (status) {
    case "Synced":
      return "success";
    case "OutOfSync":
      return "warning";
    case "Unknown":
      return "default";
  }
}

function formatLastSynced(
  history: ArgoCDApplication["status"]["history"]
): string | null {
  if (!history || history.length === 0) return null;
  const last = history[history.length - 1];
  if (!last || !last.dexKey) return null;
  const date = new Date(last.dexKey);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

// --- API ---

const ARGOCD_API_PATH =
  "/api/v1/namespaces/argocd/services/argocd-server/proxy/api/v1/applications";

async function fetchApplications(): Promise<ArgoCDApplicationsList> {
  const response = (await ApiProxy.request(
    ARGOCD_API_PATH
  )) as ArgoCDApplicationsList;
  return response;
}

// --- Component ---

export default function ApplicationsList() {
  const location = useLocation();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [healthFilter, setHealthFilter] = useState<HealthStatus | "All">("All");
  const [syncFilter, setSyncFilter] = useState<SyncStatus | "All">("All");
  const [projectFilter, setProjectFilter] = useState<string>("All");

  // Initialize project filter from URL search param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const project = params.get("project");
    if (project) {
      setProjectFilter(project);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchApplications()
      .then((data) => {
        if (cancelled) return;
        const rows: ApplicationRow[] = (data.items ?? []).map((app) => ({
          name: app.metadata?.name ?? "unknown",
          namespace: app.metadata?.namespace ?? "unknown",
          project: app.spec?.project ?? "unknown",
          healthStatus:
            (app.status?.health?.status as HealthStatus) ?? "Unknown",
          syncStatus: (app.status?.sync?.status as SyncStatus) ?? "Unknown",
          targetRevision: app.spec?.targetRevision ?? "",
          lastSynced: formatLastSynced(app.status?.history),
        }));
        setApplications(rows);
        setLoading(false);
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
  }, []);

  const projects = useMemo(() => {
    const set = new Set(applications.map((app) => app.project));
    return Array.from(set).sort();
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (healthFilter !== "All" && app.healthStatus !== healthFilter)
        return false;
      if (syncFilter !== "All" && app.syncStatus !== syncFilter) return false;
      if (projectFilter !== "All" && app.project !== projectFilter)
        return false;
      return true;
    });
  }, [applications, healthFilter, syncFilter, projectFilter]);

  const columns = [
    {
      label: "App Name",
      getter: (row: ApplicationRow) => row.name,
    },
    {
      label: "Namespace",
      getter: (row: ApplicationRow) => row.namespace,
    },
    {
      label: "Project",
      getter: (row: ApplicationRow) => row.project,
    },
    {
      label: "Health",
      getter: (row: ApplicationRow) => (
        <StatusLabel status={healthStatusToColor(row.healthStatus)}>
          {healthStatusToLabel(row.healthStatus)}
        </StatusLabel>
      ),
    },
    {
      label: "Sync",
      getter: (row: ApplicationRow) => (
        <StatusLabel status={syncStatusToColor(row.syncStatus)}>
          {row.syncStatus}
        </StatusLabel>
      ),
    },
    {
      label: "Target Revision",
      getter: (row: ApplicationRow) => row.targetRevision || "—",
    },
    {
      label: "Last Synced",
      getter: (row: ApplicationRow) => row.lastSynced ?? "—",
    },
  ];

  return (
    <>
      <SectionHeader title="ArgoCD — Applications" />
      <SectionBox>
        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="health-filter-label">Health</InputLabel>
            <Select
              labelId="health-filter-label"
              label="Health"
              value={healthFilter}
              onChange={(e) =>
                setHealthFilter(e.target.value as HealthStatus | "All")
              }
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Healthy">Healthy</MenuItem>
              <MenuItem value="Degraded">Degraded</MenuItem>
              <MenuItem value="Progressing">Progressing</MenuItem>
              <MenuItem value="Missing">Missing</MenuItem>
              <MenuItem value="Unknown">Unknown</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sync-filter-label">Sync</InputLabel>
            <Select
              labelId="sync-filter-label"
              label="Sync"
              value={syncFilter}
              onChange={(e) =>
                setSyncFilter(e.target.value as SyncStatus | "All")
              }
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Synced">Synced</MenuItem>
              <MenuItem value="OutOfSync">OutOfSync</MenuItem>
              <MenuItem value="Unknown">Unknown</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="project-filter-label">Project</InputLabel>
            <Select
              labelId="project-filter-label"
              label="Project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <div data-testid="applications-loading">
            Loading ArgoCD applications...
          </div>
        ) : error ? (
          <div data-testid="applications-error">
            <StatusLabel status="error">ArgoCD not detected</StatusLabel>
            <p>
              Could not reach the ArgoCD server. Ensure ArgoCD is installed in
              the <code>argocd</code> namespace and the server is reachable.
            </p>
            <p>
              <strong>Error:</strong> {error}
            </p>
          </div>
        ) : (
          <SimpleTable
            columns={columns}
            data={filtered}
            emptyMessage="No ArgoCD applications found."
          />
        )}
      </SectionBox>
    </>
  );
}
