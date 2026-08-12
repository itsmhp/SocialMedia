export const TERMS_KEY = "falo.terms";
export const TERMS_VERSION = 1;

export function acceptTerms(now = Date.now()): boolean {
  try {
    localStorage.setItem(TERMS_KEY, JSON.stringify({ version: TERMS_VERSION, at: now }));
    return true;
  } catch {
    return false;
  }
}

export function hasAcceptedTerms(): boolean {
  try {
    const raw = localStorage.getItem(TERMS_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { version?: number };
    return saved.version === TERMS_VERSION;
  } catch {
    return false;
  }
}
