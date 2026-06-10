import { describe, expect, it, vi } from "vitest";
import {
  ARGOCD_DEFAULT_NAMESPACE,
  ARGOCD_PLUGIN_NAME,
  getArgoCDConfig,
  useArgoCDConfig,
} from "../config";

// --- Mock Headlamp lib ---

const { ConfigStoreCtor } = vi.hoisted(() => ({
  ConfigStoreCtor: vi.fn(),
}));

vi.mock("@kinvolk/headlamp-plugin/lib", () => ({
  ConfigStore: class {
    constructor(name: string) {
      ConfigStoreCtor(name);
    }
    get() {
      return { namespace: "argocd" };
    }
    useConfig() {
      return () => ({ namespace: "argocd" });
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

  it("useArgoCDConfig returns a hook that returns the configured namespace", () => {
    const useCfg = useArgoCDConfig();
    expect(typeof useCfg).toBe("function");
    expect(useCfg().namespace).toBe("argocd");
  });

  it("instantiates a ConfigStore scoped to the argocd plugin", () => {
    expect(ConfigStoreCtor).toHaveBeenCalledWith("argocd");
  });
});
