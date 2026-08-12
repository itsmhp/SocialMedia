import { describe, expect, it } from "vitest";
import {
  beginOperation,
  failOperation,
  localRepository,
  operationReducer,
  selectRepository,
  succeedOperation,
  type AppRepository,
} from "./repository";

const cloudRepository: AppRepository = {
  mode: "cloud",
  capabilities: {
    realtime: true,
    shareableInvites: true,
    remoteSafety: true,
  },
};

describe("repository selection", () => {
  it("stays local until every cloud readiness gate passes", () => {
    const selection = selectRepository({
      configured: true,
      explicitlyEnabled: true,
      authenticated: true,
      schemaVerified: false,
    }, cloudRepository);

    expect(selection.repository).toBe(localRepository);
    expect(selection.fallbackReason).toContain("schema verification");
  });

  it("selects exactly one cloud repository after all gates pass", () => {
    const selection = selectRepository({
      configured: true,
      explicitlyEnabled: true,
      authenticated: true,
      schemaVerified: true,
    }, cloudRepository);

    expect(selection).toEqual({ repository: cloudRepository, fallbackReason: null });
  });

  it("rejects a repository mislabeled as cloud", () => {
    expect(() => selectRepository({
      configured: true,
      explicitlyEnabled: true,
      authenticated: true,
      schemaVerified: true,
    }, localRepository)).toThrow("must declare cloud mode");
  });
});

describe("operation state", () => {
  it("ignores stale completion from an older request", () => {
    const first = beginOperation("request-one");
    const second = beginOperation("request-two");

    expect(succeedOperation(second, first.requestId ?? "")).toBe(second);
    expect(failOperation(second, first.requestId ?? "", "Old failure", true)).toBe(second);
  });

  it("records retryable failure only for the active request", () => {
    const pending = beginOperation("request-one");
    expect(failOperation(pending, "request-one", "Connection lost", true)).toEqual({
      status: "failed",
      requestId: "request-one",
      error: "Connection lost",
      retryable: true,
    });
  });

  it("keeps the newest keyed operation when requests overlap", () => {
    const first = operationReducer({}, {
      type: "started",
      key: "invite:create",
      requestId: "request-one",
    });
    const second = operationReducer(first, {
      type: "started",
      key: "invite:create",
      requestId: "request-two",
    });
    const stale = operationReducer(second, {
      type: "succeeded",
      key: "invite:create",
      requestId: "request-one",
    });

    expect(stale).toBe(second);
    expect(stale["invite:create"].requestId).toBe("request-two");
  });
});