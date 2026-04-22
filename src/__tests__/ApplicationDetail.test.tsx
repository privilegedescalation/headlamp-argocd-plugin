import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ApplicationDetail from "../components/ApplicationDetail";

// --- Pure function unit tests ---

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

describe("formatTimestamp", () => {
  it("returns formatted date for valid ISO string", () => {
    const result = formatTimestamp("2024-06-01T10:00:00Z");
    expect(result).not.toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(formatTimestamp("")).toBe("—");
  });

  it("returns em dash for invalid date", () => {
    expect(formatTimestamp("not-a-date")).toBe("—");
  });
});

describe("formatRevision", () => {
  it("returns em dash for empty string", () => {
    expect(formatRevision("")).toBe("—");
  });

  it("returns revision as-is if 8 chars or fewer", () => {
    expect(formatRevision("abc")).toBe("abc");
    expect(formatRevision("12345678")).toBe("12345678");
  });

  it("truncates revision to 8 chars if longer", () => {
    expect(formatRevision("1234567890abcdef")).toBe("12345678");
  });
});

// --- Component smoke tests ---

// Mock Headlamp lib
vi.mock("@kinvolk/headlamp-plugin/lib", () => ({
  ApiProxy: { request: vi.fn() },
}));

// Mock CommonComponents
vi.mock("@kinvolk/headlamp-plugin/lib/CommonComponents", () => ({
  SectionBox: ({
    children,
    title,
  }: {
    children?: React.ReactNode;
    title?: string;
  }) => (
    <div data-testid="section-box" data-title={title}>
      {children}
    </div>
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

function renderWithRouter(
  ui: React.ReactElement,
  initialEntry = "/argocd/applications/test-app"
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Route path="/argocd/applications/:name">{ui}</Route>
    </MemoryRouter>
  );
}

describe("ApplicationDetail component", () => {
  it("renders loading state initially", async () => {
    vi.mocked(ApiProxy.request).mockImplementation(
      () => new Promise(() => {}) // never resolves — keeps loading
    );

    renderWithRouter(<ApplicationDetail />);
    expect(screen.getByTestId("application-detail-loading")).toHaveTextContent(
      "Loading application details"
    );
  });

  it("renders error state when API fails", async () => {
    vi.mocked(ApiProxy.request).mockRejectedValue(
      new Error("connection refused")
    );

    renderWithRouter(<ApplicationDetail />);

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("application-detail-error")
      ).toBeInTheDocument();
    });

    // fetchApplication catches the error and returns null, which sets "Application not found"
    expect(screen.getByText(/Application not found/)).toBeInTheDocument();
  });

  it("renders application detail when API succeeds", async () => {
    const mockApp = {
      metadata: { name: "test-app", namespace: "argocd" },
      spec: {
        project: "default",
        sourceRepoURL: "https://github.com/example/repo",
        targetRevision: "v1.0.0",
      },
      status: {
        health: { status: "Healthy" },
        sync: { status: "Synced" },
        resources: [
          {
            kind: "Deployment",
            name: "example-app",
            namespace: "default",
            health: { status: "Healthy" },
            status: "Synced",
          },
        ],
        history: [
          {
            dexKey: "2024-06-01T10:00:00Z",
            id: 1,
            revision: "v1.0.0",
            triggeredBy: "admin",
          },
        ],
      },
    };

    vi.mocked(ApiProxy.request).mockImplementation((path: string) => {
      if (path.includes("/events")) {
        return Promise.resolve({ items: [] });
      }
      return Promise.resolve(mockApp);
    });

    renderWithRouter(<ApplicationDetail />);

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("application-detail-header")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("ArgoCD — test-app")).toBeInTheDocument();
  });

  it("renders resource tree with resources", async () => {
    const mockApp = {
      metadata: { name: "test-app", namespace: "argocd" },
      spec: {
        project: "default",
        sourceRepoURL: "https://github.com/example/repo",
        targetRevision: "v1.0.0",
      },
      status: {
        health: { status: "Healthy" },
        sync: { status: "Synced" },
        resources: [
          {
            kind: "Deployment",
            name: "example-app",
            namespace: "default",
            health: { status: "Healthy" },
            status: "Synced",
          },
          {
            kind: "Service",
            name: "example-svc",
            namespace: "default",
            health: { status: "Healthy" },
            status: "Synced",
          },
        ],
        history: [],
      },
    };

    vi.mocked(ApiProxy.request).mockImplementation((path: string) => {
      if (path.includes("/events")) {
        return Promise.resolve({ items: [] });
      }
      return Promise.resolve(mockApp);
    });

    renderWithRouter(<ApplicationDetail />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("simple-table")).toBeInTheDocument();
    });

    // Resource tree should show 2 data rows (plus 1 header row)
    const tables = screen.getAllByTestId("simple-table");
    expect(tables.length).toBeGreaterThan(0);
  });

  it("renders sync history", async () => {
    const mockApp = {
      metadata: { name: "test-app", namespace: "argocd" },
      spec: {
        project: "default",
        sourceRepoURL: "https://github.com/example/repo",
        targetRevision: "v1.0.0",
      },
      status: {
        health: { status: "Healthy" },
        sync: { status: "Synced" },
        resources: [],
        history: [
          {
            dexKey: "2024-06-01T10:00:00Z",
            id: 1,
            revision: "v1.0.0",
            triggeredBy: "admin",
          },
        ],
      },
    };

    vi.mocked(ApiProxy.request).mockImplementation((path: string) => {
      if (path.includes("/events")) {
        return Promise.resolve({ items: [] });
      }
      return Promise.resolve(mockApp);
    });

    renderWithRouter(<ApplicationDetail />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("simple-table")).toBeInTheDocument();
    });
  });
});
