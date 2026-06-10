import { ConfigStore } from "@kinvolk/headlamp-plugin/lib";

export const ARGOCD_DEFAULT_NAMESPACE = "argocd";
export const ARGOCD_PLUGIN_NAME = "argocd";

export interface ArgoCDPluginConfig {
  namespace: string;
}

const store = new ConfigStore<ArgoCDPluginConfig>(ARGOCD_PLUGIN_NAME);

export function getArgoCDConfig(): ArgoCDPluginConfig {
  const data = store.get();
  return {
    namespace: data?.namespace || ARGOCD_DEFAULT_NAMESPACE,
  };
}

export function useArgoCDConfig(): () => ArgoCDPluginConfig {
  return store.useConfig();
}

export function argocdApiPath(
  namespace: string = getArgoCDConfig().namespace
): string {
  return `/api/v1/namespaces/${namespace}/services/argocd-server/proxy/api/v1/applications`;
}
