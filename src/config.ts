import { ConfigStore } from "@kinvolk/headlamp-plugin/lib";

export const ARGOCD_DEFAULT_NAMESPACE = "argocd";
export const ARGOCD_DEFAULT_SERVICE_NAME = "argocd-server";
export const ARGOCD_DEFAULT_SERVICE_PORT = 443;
export const ARGOCD_DEFAULT_SERVICE_SCHEME = "https";
export const ARGOCD_PLUGIN_NAME = "argocd";

export interface ArgoCDPluginConfig {
  namespace: string;
  serviceName: string;
  servicePort: number;
  serviceScheme: string;
}

const store = new ConfigStore<ArgoCDPluginConfig>(ARGOCD_PLUGIN_NAME);

export function buildArgoCDProxyPath(config: ArgoCDPluginConfig): string {
  const { namespace, serviceName, servicePort, serviceScheme } = config;
  return `/api/v1/namespaces/${namespace}/services/${serviceScheme}:${serviceName}:${servicePort}/proxy/api/v1/applications`;
}

export function getArgoCDConfig(): ArgoCDPluginConfig {
  const data = store.get();
  return {
    namespace: data?.namespace || ARGOCD_DEFAULT_NAMESPACE,
    serviceName: data?.serviceName || ARGOCD_DEFAULT_SERVICE_NAME,
    servicePort: data?.servicePort || ARGOCD_DEFAULT_SERVICE_PORT,
    serviceScheme: data?.serviceScheme || ARGOCD_DEFAULT_SERVICE_SCHEME,
  };
}

export function useArgoCDConfig(): () => ArgoCDPluginConfig {
  const getConfig = store.useConfig();
  return () => {
    const data = getConfig();
    return {
      namespace: data?.namespace || ARGOCD_DEFAULT_NAMESPACE,
      serviceName: data?.serviceName || ARGOCD_DEFAULT_SERVICE_NAME,
      servicePort: data?.servicePort || ARGOCD_DEFAULT_SERVICE_PORT,
      serviceScheme: data?.serviceScheme || ARGOCD_DEFAULT_SERVICE_SCHEME,
    };
  };
}
