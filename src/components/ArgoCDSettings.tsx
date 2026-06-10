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
  ARGOCD_PLUGIN_NAME,
  ArgoCDPluginConfig,
} from "../config";

export function ArgoCDSettings(props: PluginSettingsDetailsProps) {
  const { data, onDataChange } = props;
  const config = (data ?? {}) as ArgoCDPluginConfig;

  const handleNamespaceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onDataChange?.({ ...config, namespace: event.target.value });
  };

  const settingsRows = [
    {
      name: "ArgoCD namespace",
      value: (
        <TextField
          fullWidth
          helperText="Kubernetes namespace where the ArgoCD server is installed. Used to proxy the ArgoCD REST API."
          defaultValue={config.namespace ?? ARGOCD_DEFAULT_NAMESPACE}
          onChange={handleNamespaceChange}
          variant="standard"
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
