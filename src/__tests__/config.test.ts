import { describe, expect, it, vi } from "vitest";
import {
  ARGOCD_DEFAULT_NAMESPACE,
  ARGOCD_PLUGIN_NAME,
  getArgoCDConfig,
  useArgoCDConfig,
} from "../config";

// --- Mock Headlamp lib ---

const { ConfigStoreCtor, mockGet, mockUseConfig } = vi.hoisted(() => ({
  ConfigStoreCtor: vi.fn(),
  mockGet: vi.fn(() => ({ namespace: "argocd" })),
  mockUseConfig: vi.fn(() => () => ({ namespace: "argocd" })),
}));

vi.mock("@kinvolk/headlamp-plugin/lib", () => ({
  ConfigStore: class {
    constructor(name: string) {
      ConfigStoreCtor(name);
    }
    get() {
      return mockGet();
    }
    useConfig() {
      return mockUseConfig();
    }
  },
}));

describe("config module", () => {
  it("exports the default namespace", () => {
    expect(ARGOCD_DEFAULT_NAMESPACE).toBe("argocd");
  });

  it("exports the plugin name", () => {
    expect(ARGOCD_PLUGIN_NAME).toBe("argocd");
  });

  it("getArgoCDConfig returns the configured namespace", () => {
    const cfg = getArgoCDConfig();
    expect(cfg.namespace).toBe("argocd");
  });

  it("getArgoCDConfig falls back to default when store returns undefined", () => {
    mockGet.mockReturnValueOnce(undefined);
    const cfg = getArgoCDConfig();
    expect(cfg.namespace).toBe(ARGOCD_DEFAULT_NAMESPACE);
  });

  it("useArgoCDConfig returns a hook that returns the configured namespace", () => {
    const useCfg = useArgoCDConfig();
    expect(typeof useCfg).toBe("function");
    expect(useCfg().namespace).toBe("argocd");
  });

  it("useArgoCDConfig falls back to default on fresh install (store returns undefined)", () => {
    // Regression: before the fix, useArgoCDConfig() returned store.useConfig() directly,
    // which could return undefined on first install, crashing any component reading .namespace
    mockUseConfig.mockReturnValueOnce(() => undefined);
    const getConfig = useArgoCDConfig();
    const cfg = getConfig();
    expect(cfg.namespace).toBe(ARGOCD_DEFAULT_NAMESPACE);
    expect(cfg.namespace).not.toBe("undefined");
    // Ensure the path built with this namespace is valid (no /namespaces/undefined/)
    const apiPath = `/api/v1/namespaces/${cfg.namespace}/services/argocd-server/proxy/api/v1/applications`;
    expect(apiPath).not.toContain("/namespaces/undefined/");
    expect(apiPath).toContain(`/namespaces/${ARGOCD_DEFAULT_NAMESPACE}/`);
  });

  it("instantiates a ConfigStore scoped to the argocd plugin", () => {
    expect(ConfigStoreCtor).toHaveBeenCalledWith("argocd");
  });
});
