import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  ApplicationRow,
  healthStatusToColor,
  healthStatusToLabel,
  syncStatusToColor,
} from "../components/ApplicationsList";
import ApplicationsList from "../components/ApplicationsList";

// --- Pure function unit tests ---

describe("healthStatusToColor", () => {
  it("maps Healthy to success", () => {
    expect(healthStatusToColor("Healthy")).toBe("success");
  });

  it("maps Degraded to error", () => {
    expect(healthStatusToColor("Degraded")).toBe("error");
  });

  it("maps Progressing to warning", () => {
    expect(healthStatusToColor("Progressing")).toBe("warning");
  });

  it("maps Missing to default", () => {
    expect(healthStatusToColor("Missing")).toBe("default");
  });

  it("maps Unknown to default", () => {
    expect(healthStatusToColor("Unknown")).toBe("default");
  });
});

describe("syncStatusToColor", () => {
  it("maps Synced to success", () => {
    expect(syncStatusToColor("Synced")).toBe("success");
  });

  it("maps OutOfSync to warning", () => {
    expect(syncStatusToColor("OutOfSync")).toBe("warning");
  });

  it("maps Unknown to default", () => {
    expect(syncStatusToColor("Unknown")).toBe("default");
  });
});

describe("healthStatusToLabel", () => {
  it("returns the status string as-is", () => {
    expect(healthStatusToLabel("Healthy")).toBe("Healthy");
    expect(healthStatusToLabel("Degraded")).toBe("Degraded");
    expect(healthStatusToLabel("Progressing")).toBe("Progressing");
    expect(healthStatusToLabel("Missing")).toBe("Missing");
    expect(healthStatusToLabel("Unknown")).toBe("Unknown");
  });
});

// --- Filter logic unit tests ---

const makeApp = (overrides: Partial<ApplicationRow> = {}): ApplicationRow => ({
  name: "test-app",
  namespace: "argocd",
  project: "default",
  healthStatus: "Healthy",
  syncStatus: "Synced",
  targetRevision: "HEAD",
  lastSynced: "2024-01-01T00:00:00Z",
  ...overrides,
});

const ALL_HEALTH = "All" as const;
const ALL_SYNC = "All" as const;

function applyFilters(
  apps: ApplicationRow[],
  healthFilter: ApplicationRow["healthStatus"] | "All",
  syncFilter: ApplicationRow["syncStatus"] | "All",
  projectFilter: string
): ApplicationRow[] {
  return apps.filter((app) => {
    if (healthFilter !== ALL_HEALTH && app.healthStatus !== healthFilter)
      return false;
    if (syncFilter !== ALL_SYNC && app.syncStatus !== syncFilter) return false;
    if (projectFilter !== "All" && app.project !== projectFilter) return false;
    return true;
  });
}

describe("ApplicationsList filter logic", () => {
  const apps = [
    makeApp({
      name: "app-1",
      healthStatus: "Healthy",
      syncStatus: "Synced",
      project: "proj-a",
    }),
    makeApp({
      name: "app-2",
      healthStatus: "Healthy",
      syncStatus: "OutOfSync",
      project: "proj-a",
    }),
    makeApp({
      name: "app-3",
      healthStatus: "Degraded",
      syncStatus: "OutOfSync",
      project: "proj-b",
    }),
    makeApp({
      name: "app-4",
      healthStatus: "Progressing",
      syncStatus: "Synced",
      project: "proj-b",
    }),
    makeApp({
      name: "app-5",
      healthStatus: "Unknown",
      syncStatus: "Unknown",
      project: "proj-c",
    }),
  ];

  it("returns all apps when all filters are All", () => {
    const result = applyFilters(apps, ALL_HEALTH, ALL_SYNC, "All");
    expect(result).toHaveLength(5);
  });

  it("filters by health status", () => {
    const result = applyFilters(apps, "Healthy", ALL_SYNC, "All");
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name)).toEqual(["app-1", "app-2"]);
  });

  it("filters by sync status", () => {
    const result = applyFilters(apps, ALL_HEALTH, "OutOfSync", "All");
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name)).toEqual(["app-2", "app-3"]);
  });

  it("filters by project", () => {
    const result = applyFilters(apps, ALL_HEALTH, ALL_SYNC, "proj-a");
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name)).toEqual(["app-1", "app-2"]);
  });

  it("combines multiple filters", () => {
    const result = applyFilters(apps, "Healthy", "OutOfSync", "All");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("app-2");
  });

  it("returns empty array when no apps match", () => {
    const result = applyFilters(apps, "Degraded", "Synced", "All");
    expect(result).toHaveLength(0);
  });
});

// --- Component smoke test ---

// Mock Headlamp lib
vi.mock("@kinvolk/headlamp-plugin/lib", () => ({
  ApiProxy: { request: vi.fn() },
}));

// Mock MUI
vi.mock("@mui/material/FormControl", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
}));

vi.mock("@mui/material/InputLabel", () => ({
  default: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <label data-testid="input-label" id={id}>
      {children}
    </label>
  ),
}));

vi.mock("@mui/material/Select", () => ({
  default: ({
    children,
    value,
    onChange,
    label,
  }: {
    children: React.ReactNode;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    label?: string;
  }) => (
    <select
      data-testid="select"
      value={value}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
      aria-label={label}
    >
      {children}
    </select>
  ),
}));

vi.mock("@mui/material/MenuItem", () => ({
  default: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <option data-testid="menu-item" value={value}>
      {children}
    </option>
  ),
}));

vi.mock("@mui/material/Box", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
}));

// Mock CommonComponents
vi.mock("@kinvolk/headlamp-plugin/lib/CommonComponents", () => ({
  SectionBox: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="section-box">{children}</div>
  ),
  SectionHeader: ({ title }: { title: string }) => (
    <div data-testid="section-header">{title}</div>
  ),
  StatusLabel: ({
    status,
    children,
  }: {
    status: string;
    children?: React.ReactNode;
  }) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
  SimpleTable: ({
    columns,
    data,
    emptyMessage,
  }: {
    columns: Array<{
      label: string;
      getter: (row: unknown) => React.ReactNode;
    }>;
    data: unknown[];
    emptyMessage?: string;
  }) =>
    data.length === 0 ? (
      <div data-testid="simple-table-empty">{emptyMessage}</div>
    ) : (
      <table data-testid="simple-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.label}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.label}>{col.getter(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ApplicationsList component", () => {
  it("renders loading state initially", async () => {
    vi.mocked(ApiProxy.request).mockImplementation(
      () => new Promise(() => {}) // never resolves — keeps loading
    );

    renderWithRouter(<ApplicationsList />);
    expect(screen.getByTestId("applications-loading")).toHaveTextContent(
      "Loading ArgoCD applications"
    );
  });

  it("renders error state when API fails", async () => {
    vi.mocked(ApiProxy.request).mockRejectedValue(
      new Error("connection refused")
    );

    renderWithRouter(<ApplicationsList />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("applications-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/connection refused/)).toBeInTheDocument();
  });

  it("renders table with applications when API succeeds", async () => {
    const mockResponse = {
      items: [
        {
          metadata: { name: "app-1", namespace: "argocd" },
          spec: { project: "default", targetRevision: "v1.0.0" },
          status: {
            health: { status: "Healthy" },
            sync: { status: "Synced" },
            history: [
              { dexKey: "2024-06-01T10:00:00Z", id: 0, revision: "v1.0.0" },
            ],
          },
        },
        {
          metadata: { name: "app-2", namespace: "argocd" },
          spec: { project: "default", targetRevision: "HEAD" },
          status: {
            health: { status: "Degraded" },
            sync: { status: "OutOfSync" },
            history: [],
          },
        },
      ],
    };

    vi.mocked(ApiProxy.request).mockResolvedValue(mockResponse);

    renderWithRouter(<ApplicationsList />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("simple-table")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(3); // 1 header + 2 data rows
  });

  it("renders empty message when no applications", async () => {
    vi.mocked(ApiProxy.request).mockResolvedValue({ items: [] });

    renderWithRouter(<ApplicationsList />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("simple-table-empty")).toBeInTheDocument();
    });

    expect(
      screen.getByText("No ArgoCD applications found.")
    ).toBeInTheDocument();
  });
});
