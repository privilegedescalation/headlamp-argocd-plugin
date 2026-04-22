import { describe, expect, it } from "vitest";
import type { ArgoCDApplication } from "../api/argocd";

// --- Matching helpers (copied for unit testing) ---

function appsForNamespace(
  apps: ArgoCDApplication[],
  namespace: string
): ArgoCDApplication[] {
  return apps.filter((app) => app.spec?.destination?.namespace === namespace);
}

function appsForDeployment(
  apps: ArgoCDApplication[],
  deploymentName: string
): ArgoCDApplication[] {
  return apps.filter((app) =>
    (app.status?.resources ?? []).some(
      (res) => res.kind === "Deployment" && res.name === deploymentName
    )
  );
}

// --- Fixture factory ---

function makeApp(
  overrides: Partial<ArgoCDApplication> = {}
): ArgoCDApplication {
  return {
    metadata: { name: "test-app", namespace: "argocd" },
    spec: { project: "default" },
    status: {},
    ...overrides,
  } as ArgoCDApplication;
}

// --- appsForNamespace tests ---

describe("appsForNamespace", () => {
  it("returns apps whose destination.namespace matches", () => {
    const apps = [
      makeApp({
        metadata: { name: "app-a", namespace: "argocd" },
        spec: { project: "default", destination: { namespace: "web" } },
      }),
      makeApp({
        metadata: { name: "app-b", namespace: "argocd" },
        spec: { project: "default", destination: { namespace: "data" } },
      }),
    ];
    expect(appsForNamespace(apps, "web").map((a) => a.metadata.name)).toEqual([
      "app-a",
    ]);
  });

  it("returns empty array when no match", () => {
    const apps = [
      makeApp({
        metadata: { name: "app-a", namespace: "argocd" },
        spec: { project: "default", destination: { namespace: "web" } },
      }),
    ];
    expect(appsForNamespace(apps, "data")).toEqual([]);
  });

  it("returns empty array for empty app list", () => {
    expect(appsForNamespace([], "web")).toEqual([]);
  });

  it("returns empty array when destination is undefined", () => {
    const apps = [
      makeApp({
        metadata: { name: "app-a", namespace: "argocd" },
        spec: { project: "default" },
      }),
    ];
    expect(appsForNamespace(apps, "web")).toEqual([]);
  });
});

// --- appsForDeployment tests ---

describe("appsForDeployment", () => {
  it("returns apps that manage the deployment via status.resources", () => {
    const apps = [
      makeApp({
        metadata: { name: "app-a", namespace: "argocd" },
        status: {
          resources: [{ kind: "Deployment", name: "nginx", namespace: "web" }],
        },
      }),
      makeApp({
        metadata: { name: "app-b", namespace: "argocd" },
        status: {
          resources: [{ kind: "Service", name: "nginx", namespace: "web" }],
        },
      }),
    ];
    expect(
      appsForDeployment(apps, "nginx").map((a) => a.metadata.name)
    ).toEqual(["app-a"]);
  });

  it("returns empty array when no deployment resource matches", () => {
    const apps = [
      makeApp({
        metadata: { name: "app-a", namespace: "argocd" },
        status: {
          resources: [{ kind: "Service", name: "nginx", namespace: "web" }],
        },
      }),
    ];
    expect(appsForDeployment(apps, "nginx")).toEqual([]);
  });

  it("returns empty array for empty app list", () => {
    expect(appsForDeployment([], "nginx")).toEqual([]);
  });

  it("returns empty array when resources is undefined", () => {
    const apps = [
      makeApp({ metadata: { name: "app-a", namespace: "argocd" }, status: {} }),
    ];
    expect(appsForDeployment(apps, "nginx")).toEqual([]);
  });

  it("returns multiple apps that manage the same deployment", () => {
    const apps = [
      makeApp({
        metadata: { name: "app-a", namespace: "argocd" },
        status: { resources: [{ kind: "Deployment", name: "nginx" }] },
      }),
      makeApp({
        metadata: { name: "app-b", namespace: "argocd" },
        status: { resources: [{ kind: "Deployment", name: "nginx" }] },
      }),
    ];
    expect(
      appsForDeployment(apps, "nginx").map((a) => a.metadata.name)
    ).toEqual(["app-a", "app-b"]);
  });
});
