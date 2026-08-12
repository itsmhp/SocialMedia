import { createContext, useContext, useReducer, type ReactNode } from "react";
import { useCloudAuth } from "../lib/CloudAuthProvider";
import { makeId } from "../lib/id";
import {
  IDLE_OPERATION,
  operationReducer,
  selectRepository,
  type AppRepository,
  type OperationMap,
  type OperationState,
  type RepositorySelection,
} from "./repository";

const cloudRepositoryDescriptor: AppRepository = {
  mode: "cloud",
  capabilities: {
    realtime: true,
    shareableInvites: true,
    remoteSafety: true,
  },
};

interface RepositoryContextValue extends RepositorySelection {
  operations: OperationMap;
  operation: (key: string) => OperationState;
  execute: <Result>(key: string, task: () => Promise<Result>) => Promise<Result>;
  clearOperation: (key: string) => void;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const auth = useCloudAuth();
  const [operations, dispatchOperation] = useReducer(operationReducer, {});
  const selection = selectRepository({
    configured: auth.configured,
    explicitlyEnabled: false,
    authenticated: auth.status === "signedIn",
    schemaVerified: false,
  }, cloudRepositoryDescriptor);

  const execute = async <Result,>(key: string, task: () => Promise<Result>) => {
    const requestId = makeId("request");
    dispatchOperation({ type: "started", key, requestId });
    try {
      const result = await task();
      dispatchOperation({ type: "succeeded", key, requestId });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "The request failed. Try again.";
      dispatchOperation({
        type: "failed",
        key,
        requestId,
        error: message,
        retryable: true,
      });
      throw error;
    }
  };

  return (
    <RepositoryContext.Provider value={{
      ...selection,
      operations,
      operation: (key) => operations[key] ?? IDLE_OPERATION,
      execute,
      clearOperation: (key) => dispatchOperation({ type: "cleared", key }),
    }}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (!context) throw new Error("useRepository must be used within RepositoryProvider");
  return context;
}