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
  const getConfig = store.useConfig();
  return () => {
    const data = getConfig();
    return { namespace: data?.namespace || ARGOCD_DEFAULT_NAMESPACE };
  };
}
