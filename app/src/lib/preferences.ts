export const PREFERENCES_KEY = "unggun.preferences";
const VERSION = 1;

export interface Preferences {
  version: typeof VERSION;
  notifications: {
    invites: boolean;
    expiryVotes: boolean;
    roomActivity: boolean;
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
  };
}

export const DEFAULT_PREFERENCES: Preferences = {
  version: VERSION,
  notifications: {
    invites: true,
    expiryVotes: true,
    roomActivity: false,
    quietHoursEnabled: false,
    quietStart: "22:00",
    quietEnd: "08:00",
  },
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const saved = JSON.parse(raw) as Partial<Preferences>;
    const notifications = saved.notifications;
    if (
      saved.version !== VERSION ||
      !notifications ||
      typeof notifications.invites !== "boolean" ||
      typeof notifications.expiryVotes !== "boolean" ||
      typeof notifications.roomActivity !== "boolean" ||
      typeof notifications.quietHoursEnabled !== "boolean" ||
      typeof notifications.quietStart !== "string" ||
      typeof notifications.quietEnd !== "string" ||
      !TIME_PATTERN.test(notifications.quietStart) ||
      !TIME_PATTERN.test(notifications.quietEnd)
    ) {
      return DEFAULT_PREFERENCES;
    }
    return { version: VERSION, notifications: { ...notifications } };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): boolean {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export function clearPreferences(): boolean {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
    return true;
  } catch {
    return false;
  }
}