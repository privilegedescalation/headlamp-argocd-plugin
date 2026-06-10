import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ArgoCDSettings } from "../components/ArgoCDSettings";

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
  }: {
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    helperText?: string;
  }) => (
    <div data-testid="text-field">
      <input
        data-testid="namespace-input"
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
  it("renders a NameValueTable with the namespace row", () => {
    onDataChange.mockClear();
    render(<ArgoCDSettings onDataChange={onDataChange} data={{}} />);

    expect(screen.getByTestId("name-value-table")).toBeInTheDocument();
    expect(screen.getByText("ArgoCD namespace")).toBeInTheDocument();
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
    expect(input.defaultValue).toBe("argocd");
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

    expect(onDataChange).toHaveBeenCalledWith({
      namespace: "argo-cd-prod",
    });
  });
});
