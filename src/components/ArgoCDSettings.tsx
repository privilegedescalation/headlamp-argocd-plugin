import {
  PluginSettingsDetailsProps,
  registerPluginSettings,
} from "@kinvolk/headlamp-plugin/lib";
import { NameValueTable } from "@kinvolk/headlamp-plugin/lib/CommonComponents";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import React from "react";
import {
  ARGOCD_DEFAULT_NAMESPACE,
  ARGOCD_DEFAULT_SERVICE_NAME,
  ARGOCD_DEFAULT_SERVICE_PORT,
  ARGOCD_DEFAULT_SERVICE_SCHEME,
  ARGOCD_PLUGIN_NAME,
  ArgoCDPluginConfig,
} from "../config";

export function ArgoCDSettings(props: PluginSettingsDetailsProps) {
  const { data, onDataChange } = props;
  const config = (data ?? {}) as ArgoCDPluginConfig;

  const handleNamespaceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onDataChange?.({ ...config, namespace: event.target.value.trim() });
  };

  const handleServiceNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onDataChange?.({ ...config, serviceName: event.target.value.trim() });
  };

  const handleServicePortChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const port = parseInt(event.target.value.trim(), 10);
    if (!isNaN(port)) {
      onDataChange?.({ ...config, servicePort: port });
    }
  };

  const handleServiceSchemeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onDataChange?.({ ...config, serviceScheme: event.target.value.trim() });
  };

  const settingsRows = [
    {
      name: "ArgoCD namespace",
      value: (
        <TextField
          fullWidth
          helperText="Kubernetes namespace where the ArgoCD server is installed."
          defaultValue={config.namespace ?? ARGOCD_DEFAULT_NAMESPACE}
          onChange={handleNamespaceChange}
          variant="standard"
          inputProps={{ "data-testid": "namespace-input" }}
        />
      ),
    },
    {
      name: "ArgoCD service name",
      value: (
        <TextField
          fullWidth
          helperText="Kubernetes service name for the ArgoCD server. Default: argocd-server."
          defaultValue={config.serviceName ?? ARGOCD_DEFAULT_SERVICE_NAME}
          onChange={handleServiceNameChange}
          variant="standard"
          inputProps={{ "data-testid": "service-name-input" }}
        />
      ),
    },
    {
      name: "ArgoCD service port",
      value: (
        <TextField
          fullWidth
          helperText="Port used to reach the ArgoCD server. Default: 443."
          defaultValue={String(config.servicePort ?? ARGOCD_DEFAULT_SERVICE_PORT)}
          onChange={handleServicePortChange}
          variant="standard"
          inputProps={{ "data-testid": "service-port-input" }}
        />
      ),
    },
    {
      name: "ArgoCD service scheme",
      value: (
        <TextField
          fullWidth
          helperText="Protocol scheme for the Kubernetes service proxy (http or https). Default: https."
          defaultValue={config.serviceScheme ?? ARGOCD_DEFAULT_SERVICE_SCHEME}
          onChange={handleServiceSchemeChange}
          variant="standard"
          inputProps={{ "data-testid": "service-scheme-input" }}
        />
      ),
    },
  ];

  return (
    <Box width="80%">
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}

registerPluginSettings(ARGOCD_PLUGIN_NAME, ArgoCDSettings, true);
