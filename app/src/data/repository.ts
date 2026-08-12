export type AppMode = "localDemo" | "cloud";

export interface RepositoryCapabilities {
  realtime: boolean;
  shareableInvites: boolean;
  remoteSafety: boolean;
}

export interface AppRepository {
  mode: AppMode;
  capabilities: RepositoryCapabilities;
}

export interface CloudReadiness {
  configured: boolean;
  explicitlyEnabled: boolean;
  authenticated: boolean;
  schemaVerified: boolean;
}

export interface RepositorySelection {
  repository: AppRepository;
  fallbackReason: string | null;
}

export const localRepository: AppRepository = {
  mode: "localDemo",
  capabilities: {
    realtime: false,
    shareableInvites: false,
    remoteSafety: false,
  },
};

export function selectRepository(
  readiness: CloudReadiness,
  cloudRepository: AppRepository,
): RepositorySelection {
  if (cloudRepository.mode !== "cloud") {
    throw new Error("Cloud repository must declare cloud mode.");
  }

  const missing = [
    !readiness.configured && "configuration",
    !readiness.explicitlyEnabled && "explicit enablement",
    !readiness.authenticated && "authentication",
    !readiness.schemaVerified && "schema verification",
  ].filter((item): item is string => Boolean(item));

  if (missing.length) {
    return {
      repository: localRepository,
      fallbackReason: `Cloud mode unavailable: ${missing.join(", ")}.`,
    };
  }

  return { repository: cloudRepository, fallbackReason: null };
}

export type OperationStatus = "idle" | "pending" | "succeeded" | "failed";

export interface OperationState {
  status: OperationStatus;
  requestId: string | null;
  error: string | null;
  retryable: boolean;
}

export const IDLE_OPERATION: OperationState = {
  status: "idle",
  requestId: null,
  error: null,
  retryable: false,
};

export function beginOperation(requestId: string): OperationState {
  return { status: "pending", requestId, error: null, retryable: false };
}

export function succeedOperation(
  current: OperationState,
  requestId: string,
): OperationState {
  if (current.requestId !== requestId) return current;
  return { status: "succeeded", requestId, error: null, retryable: false };
}

export function failOperation(
  current: OperationState,
  requestId: string,
  error: string,
  retryable: boolean,
): OperationState {
  if (current.requestId !== requestId) return current;
  return { status: "failed", requestId, error, retryable };
}

export type OperationMap = Record<string, OperationState>;

export type OperationAction =
  | { type: "started"; key: string; requestId: string }
  | { type: "succeeded"; key: string; requestId: string }
  | { type: "failed"; key: string; requestId: string; error: string; retryable: boolean }
  | { type: "cleared"; key: string };

export function operationReducer(
  state: OperationMap,
  action: OperationAction,
): OperationMap {
  if (action.type === "cleared") {
    if (!(action.key in state)) return state;
    const next = { ...state };
    delete next[action.key];
    return next;
  }

  const current = state[action.key] ?? IDLE_OPERATION;
  const next = action.type === "started"
    ? beginOperation(action.requestId)
    : action.type === "succeeded"
      ? succeedOperation(current, action.requestId)
      : failOperation(current, action.requestId, action.error, action.retryable);

  return next === current ? state : { ...state, [action.key]: next };
}