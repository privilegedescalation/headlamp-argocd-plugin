import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ArgoCDSettings } from "../components/ArgoCDSettings";
import {
  ARGOCD_DEFAULT_NAMESPACE,
  ARGOCD_DEFAULT_SERVICE_NAME,
  ARGOCD_DEFAULT_SERVICE_PORT,
  ARGOCD_DEFAULT_SERVICE_SCHEME,
} from "../config";

// --- Mock Headlamp lib ---

const onDataChange = vi.fn();

vi.mock("@kinvolk/headlamp-plugin/lib", () => ({
  registerPluginSettings: vi.fn(),
  ConfigStore: class {
    useConfig() {
      return () => ({ namespace: "argocd" });
    }
  },
}));

// --- Mock CommonComponents ---

vi.mock("@kinvolk/headlamp-plugin/lib/CommonComponents", () => ({
  NameValueTable: ({
    rows,
  }: {
    rows: Array<{ name: string; value: React.ReactNode }>;
  }) => (
    <table data-testid="name-value-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

// --- Mock MUI TextField ---

vi.mock("@mui/material/TextField", () => ({
  default: ({
    defaultValue,
    onChange,
    helperText,
    inputProps,
  }: {
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    helperText?: string;
    inputProps?: Record<string, unknown>;
  }) => (
    <div data-testid="text-field">
      <input
        data-testid={inputProps?.["data-testid"] as string | undefined}
        defaultValue={defaultValue}
        onChange={onChange}
      />
      <span data-testid="text-field-helper">{helperText}</span>
    </div>
  ),
}));

vi.mock("@mui/material/Box", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
}));

// --- Tests ---

describe("ArgoCDSettings", () => {
  it("renders a NameValueTable with all settings rows", () => {
    onDataChange.mockClear();
    render(<ArgoCDSettings onDataChange={onDataChange} data={{}} />);

    expect(screen.getByTestId("name-value-table")).toBeInTheDocument();
    expect(screen.getByText("ArgoCD namespace")).toBeInTheDocument();
    expect(screen.getByText("ArgoCD service name")).toBeInTheDocument();
    expect(screen.getByText("ArgoCD service port")).toBeInTheDocument();
    expect(screen.getByText("ArgoCD service scheme")).toBeInTheDocument();
  });

  it("prefills the namespace from the configured value", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ namespace: "my-argocd" }}
      />
    );

    const input = screen.getByTestId("namespace-input") as HTMLInputElement;
    expect(input.defaultValue).toBe("my-argocd");
  });

  it("falls back to the default namespace when none is set", () => {
    onDataChange.mockClear();
    render(<ArgoCDSettings onDataChange={onDataChange} data={{}} />);

    const input = screen.getByTestId("namespace-input") as HTMLInputElement;
    expect(input.defaultValue).toBe(ARGOCD_DEFAULT_NAMESPACE);
  });

  it("prefills service name from the configured value", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ serviceName: "argo-argocd-server" }}
      />
    );

    const input = screen.getByTestId("service-name-input") as HTMLInputElement;
    expect(input.defaultValue).toBe("argo-argocd-server");
  });

  it("falls back to default service name when none is set", () => {
    onDataChange.mockClear();
    render(<ArgoCDSettings onDataChange={onDataChange} data={{}} />);

    const input = screen.getByTestId("service-name-input") as HTMLInputElement;
    expect(input.defaultValue).toBe(ARGOCD_DEFAULT_SERVICE_NAME);
  });

  it("falls back to default service port when none is set", () => {
    onDataChange.mockClear();
    render(<ArgoCDSettings onDataChange={onDataChange} data={{}} />);

    const input = screen.getByTestId("service-port-input") as HTMLInputElement;
    expect(input.defaultValue).toBe(String(ARGOCD_DEFAULT_SERVICE_PORT));
  });

  it("falls back to default service scheme when none is set", () => {
    onDataChange.mockClear();
    render(<ArgoCDSettings onDataChange={onDataChange} data={{}} />);

    const input = screen.getByTestId(
      "service-scheme-input"
    ) as HTMLInputElement;
    expect(input.defaultValue).toBe(ARGOCD_DEFAULT_SERVICE_SCHEME);
  });

  it("calls onDataChange with the new namespace when the input changes", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ namespace: "argocd" }}
      />
    );

    const input = screen.getByTestId("namespace-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "argo-cd-prod" } });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "argo-cd-prod" })
    );
  });

  it("trims whitespace from the namespace value on change", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ namespace: "argocd" }}
      />
    );

    const input = screen.getByTestId("namespace-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  argo-cd-prod  " } });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "argo-cd-prod" })
    );
  });

  it("calls onDataChange with the new service name when the input changes", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ serviceName: "argocd-server" }}
      />
    );

    const input = screen.getByTestId("service-name-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "argo-argocd-server" } });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: "argo-argocd-server" })
    );
  });

  it("calls onDataChange with the new service port (as number) when the input changes", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ servicePort: 443 }}
      />
    );

    const input = screen.getByTestId("service-port-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "80" } });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ servicePort: 80 })
    );
  });

  it("ignores non-numeric service port input", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ servicePort: 443 }}
      />
    );

    const input = screen.getByTestId("service-port-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "not-a-number" } });

    expect(onDataChange).not.toHaveBeenCalled();
  });

  it("calls onDataChange with the new service scheme when the input changes", () => {
    onDataChange.mockClear();
    render(
      <ArgoCDSettings
        onDataChange={onDataChange}
        data={{ serviceScheme: "https" }}
      />
    );

    const input = screen.getByTestId(
      "service-scheme-input"
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "http" } });

    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ serviceScheme: "http" })
    );
  });
});
