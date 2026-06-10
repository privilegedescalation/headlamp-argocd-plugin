import { ApiProxy } from "@kinvolk/headlamp-plugin/lib";
import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ApplicationsList from "../components/ApplicationsList";

// --- Mocks: custom namespace ---

vi.mock("@kinvolk/headlamp-plugin/lib", () => ({
  ApiProxy: { request: vi.fn() },
  ConfigStore: class {
    get() {
      return { namespace: "custom-argo" };
    }
    useConfig() {
      return () => ({ namespace: "custom-argo" });
    }
  },
}));

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
  SimpleTable: () => <div data-testid="simple-table" />,
}));

vi.mock("@mui/material/Box", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
}));
vi.mock("@mui/material/FormControl", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
}));
vi.mock("@mui/material/InputLabel", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <label data-testid="input-label">{children}</label>
  ),
}));
vi.mock("@mui/material/Select", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <select data-testid="select">{children}</select>
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

describe("ApplicationsList uses configured namespace", () => {
  it("requests the ArgoCD API from the configured namespace", async () => {
    vi.mocked(ApiProxy.request).mockResolvedValue({ items: [] });

    render(
      <MemoryRouter>
        <ApplicationsList />
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(ApiProxy.request).toHaveBeenCalled();
    });

    const calledPath = vi.mocked(ApiProxy.request).mock.calls[0]?.[0] as string;
    expect(calledPath).toContain("/api/v1/namespaces/custom-argo/");
    expect(calledPath).toContain(
      "/services/argocd-server/proxy/api/v1/applications"
    );
    expect(calledPath).not.toContain("/api/v1/namespaces/argocd/");
  });
});
