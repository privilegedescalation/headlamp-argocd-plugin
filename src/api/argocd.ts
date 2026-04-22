// --- ArgoCD API types ---

/**
 * Health status values returned by ArgoCD Application status.
 */
export type ArgoCDHealthStatus =
  | "Healthy"
  | "Degraded"
  | "Progressing"
  | "Missing"
  | "Unknown";

/**
 * Sync status values returned by ArgoCD Application status.
 */
export type ArgoCDSyncStatus = "Synced" | "OutOfSync" | "Unknown";

/**
 * An ArgoCD Application resource.
 * Matches the ArgoCD server API /api/v1/applications response shape.
 */
export interface ArgoCDApplication {
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
  };
  spec: {
    project: string;
    sourceRepoURL?: string;
    targetRevision?: string;
    path?: string;
    destination?: {
      server?: string;
      namespace?: string;
      name?: string;
    };
    sources?: Array<{
      repoURL?: string;
      targetRevision?: string;
      path?: string;
    }>;
  };
  status: {
    health?: {
      status: ArgoCDHealthStatus;
      message?: string;
    };
    sync?: {
      status: ArgoCDSyncStatus;
      comparedTo?: {
        destination?: {
          server?: string;
          namespace?: string;
        };
        source?: {
          repoURL?: string;
          path?: string;
          targetRevision?: string;
        };
      };
    };
    history?: Array<{
      dexKey: string; // ISO 8601 timestamp
      id: number;
      revision: string;
      deployStartedAt?: string;
      triggeredBy?: string;
    }>;
    resources?: Array<{
      kind: string;
      namespace?: string;
      name: string;
      group?: string;
      status?: string;
      health?: {
        status: ArgoCDHealthStatus;
      };
    }>;
    sourceType?: string;
    summary?: {
      externalURLs?: string[];
      images?: string[];
    };
  };
}

/**
 * Response envelope for the ArgoCD Applications list API.
 */
export interface ArgoCDApplicationsList {
  items: ArgoCDApplication[];
  metadata?: {
    resourceVersion?: string;
    remainingItemCount?: number;
  };
}
