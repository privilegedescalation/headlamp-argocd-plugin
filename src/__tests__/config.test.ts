import { describe, expect, it, vi } from "vitest";
import {
  ARGOCD_DEFAULT_NAMESPACE,
  ARGOCD_DEFAULT_SERVICE_NAME,
  ARGOCD_DEFAULT_SERVICE_PORT,
  ARGOCD_DEFAULT_SERVICE_SCHEME,
  ARGOCD_PLUGIN_NAME,
  buildArgoCDProxyPath,
  getArgoCDConfig,
  useArgoCDConfig,
} from "../config";

// --- Mock Headlamp lib ---

const { ConfigStoreCtor, mockGet, mockUseConfig } = vi.hoisted(() => ({
  ConfigStoreCtor: vi.fn(),
  mockGet: vi.fn(() => ({
    namespace: "argocd",
    serviceName: "argocd-server",
    servicePort: 443,
    serviceScheme: "https",
  })),
  mockUseConfig: vi.fn(() => () => ({
    namespace: "argocd",
    serviceName: "argocd-server",
    servicePort: 443,
    serviceScheme: "https",
  })),
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

  it("exports the default service name", () => {
    expect(ARGOCD_DEFAULT_SERVICE_NAME).toBe("argocd-server");
  });

  it("exports the default service port", () => {
    expect(ARGOCD_DEFAULT_SERVICE_PORT).toBe(443);
  });

  it("exports the default service scheme", () => {
    expect(ARGOCD_DEFAULT_SERVICE_SCHEME).toBe("https");
  });

  it("exports the plugin name", () => {
    expect(ARGOCD_PLUGIN_NAME).toBe("argocd");
  });

  it("getArgoCDConfig returns the configured namespace", () => {
    const cfg = getArgoCDConfig();
    expect(cfg.namespace).toBe("argocd");
  });

  it("getArgoCDConfig returns all fields with defaults", () => {
    const cfg = getArgoCDConfig();
    expect(cfg.serviceName).toBe("argocd-server");
    expect(cfg.servicePort).toBe(443);
    expect(cfg.serviceScheme).toBe("https");
  });

  it("getArgoCDConfig falls back to defaults when store returns undefined", () => {
    mockGet.mockReturnValueOnce(undefined);
    const cfg = getArgoCDConfig();
    expect(cfg.namespace).toBe(ARGOCD_DEFAULT_NAMESPACE);
    expect(cfg.serviceName).toBe(ARGOCD_DEFAULT_SERVICE_NAME);
    expect(cfg.servicePort).toBe(ARGOCD_DEFAULT_SERVICE_PORT);
    expect(cfg.serviceScheme).toBe(ARGOCD_DEFAULT_SERVICE_SCHEME);
  });

  it("useArgoCDConfig returns a hook that returns the configured namespace", () => {
    const useCfg = useArgoCDConfig();
    expect(typeof useCfg).toBe("function");
    expect(useCfg().namespace).toBe("argocd");
  });

  it("useArgoCDConfig falls back to defaults on fresh install (store returns undefined)", () => {
    // Regression: before the fix, useArgoCDConfig() returned store.useConfig() directly,
    // which could return undefined on first install, crashing any component reading .namespace
    mockUseConfig.mockReturnValueOnce(() => undefined);
    const getConfig = useArgoCDConfig();
    const cfg = getConfig();
    expect(cfg.namespace).toBe(ARGOCD_DEFAULT_NAMESPACE);
    expect(cfg.namespace).not.toBe("undefined");
    expect(cfg.serviceName).toBe(ARGOCD_DEFAULT_SERVICE_NAME);
    expect(cfg.servicePort).toBe(ARGOCD_DEFAULT_SERVICE_PORT);
    expect(cfg.serviceScheme).toBe(ARGOCD_DEFAULT_SERVICE_SCHEME);
  });

  it("instantiates a ConfigStore scoped to the argocd plugin", () => {
    expect(ConfigStoreCtor).toHaveBeenCalledWith("argocd");
  });
});

describe("buildArgoCDProxyPath", () => {
  it("builds the default proxy path", () => {
    const path = buildArgoCDProxyPath({
      namespace: "argocd",
      serviceName: "argocd-server",
      servicePort: 443,
      serviceScheme: "https",
    });
    expect(path).toBe(
      "/api/v1/namespaces/argocd/services/https:argocd-server:443/proxy/api/v1/applications"
    );
  });

  it("builds a custom service name path", () => {
    const path = buildArgoCDProxyPath({
      namespace: "argocd",
      serviceName: "argo-argocd-server",
      servicePort: 443,
      serviceScheme: "https",
    });
    expect(path).toBe(
      "/api/v1/namespaces/argocd/services/https:argo-argocd-server:443/proxy/api/v1/applications"
    );
  });

  it("builds a custom namespace + port path", () => {
    const path = buildArgoCDProxyPath({
      namespace: "cicd",
      serviceName: "argocd-server",
      servicePort: 80,
      serviceScheme: "http",
    });
    expect(path).toBe(
      "/api/v1/namespaces/cicd/services/http:argocd-server:80/proxy/api/v1/applications"
    );
  });

  it("encodes all four config values into the path", () => {
    const path = buildArgoCDProxyPath({
      namespace: "my-ns",
      serviceName: "my-svc",
      servicePort: 8080,
      serviceScheme: "https",
    });
    expect(path).toContain("/namespaces/my-ns/");
    expect(path).toContain("https:my-svc:8080");
    expect(path).not.toContain("/namespaces/undefined/");
    expect(path).not.toContain("undefined");
  });
});
