const TOKEN_PATTERN = /^[a-f0-9]{48}$/;
const PENDING_INVITE_KEY = "unggun.pendingInvite";

export function normalizeInviteToken(value: string): string | null {
  const token = value.trim().toLowerCase();
  return TOKEN_PATTERN.test(token) ? token : null;
}

export function inviteTokenFromUrl(value: string): string | null {
  try {
    const hash = new URL(value).hash.replace(/^#/, "");
    const token = new URLSearchParams(hash).get("invite");
    return token ? normalizeInviteToken(token) : null;
  } catch {
    return null;
  }
}

export function createInviteUrl(token: string, baseUrl = window.location.href): string {
  const normalized = normalizeInviteToken(token);
  if (!normalized) throw new Error("Invalid invite token.");
  const url = new URL(baseUrl);
  url.searchParams.delete("invite");
  url.hash = new URLSearchParams({ invite: normalized }).toString();
  return url.href;
}

export function captureInviteTokenFromAddressBar(): string | null {
  const token = inviteTokenFromUrl(window.location.href);
  if (!token) return pendingInviteToken();
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  url.hash = "";
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, token);
  } catch {
    // Continue so the secret is still removed from browser-visible history.
  } finally {
    window.history.replaceState(null, "", url);
  }
  return token;
}

export function pendingInviteToken(): string | null {
  try {
    const token = sessionStorage.getItem(PENDING_INVITE_KEY);
    const normalized = token ? normalizeInviteToken(token) : null;
    if (token && !normalized) sessionStorage.removeItem(PENDING_INVITE_KEY);
    return normalized;
  } catch {
    return null;
  }
}

export function clearPendingInviteToken(): void {
  try {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // A blocked storage API should not prevent normal local app use.
  }
}