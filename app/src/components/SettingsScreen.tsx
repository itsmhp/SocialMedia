import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleHelp,
  CloudOff,
  Database,
  ExternalLink,
  FileText,
  Info,
  KeyRound,
  Mail,
  Monitor,
  Moon,
  PackageOpen,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sun,
  SunMoon,
  Trash2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { SettingsPage } from "../types";
import { useStore } from "../data/store";
import { clearAppState } from "../data/localState";
import { updateRemoteProfile } from "../data/supabaseRepository";
import { makeId } from "../lib/id";
import { plural } from "../lib/text";
import { saveProfile } from "../lib/profile";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "../lib/preferences";
import { applyThemePreference, type ThemePreference } from "../lib/theme";
import { resetLocalStorage } from "../lib/localReset";
import { APP_VERSION } from "../lib/version";
import { useCloudAuth } from "../lib/CloudAuthProvider";
import { CloudAccountCard } from "./CloudAccountCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { ProfileForm } from "./ProfileForm";
import { SettingsLegal, type LegalPageKind } from "./SettingsLegal";

const SUPPORT_URL = "https://github.com/itsmhp/SocialMedia/issues/new";

const PAGE_TITLES: Record<SettingsPage, string> = {
  home: "Settings",
  profile: "Profile",
  account: "Account",
  appearance: "Appearance",
  notifications: "Notifications",
  privacy: "Privacy & Safety",
  data: "Data",
  help: "Help",
  about: "About",
  "privacy-policy": "Privacy Policy",
  terms: "Terms of Use",
  guidelines: "Community Guidelines",
  licenses: "Open-source licenses",
};

type Confirmation = "discard" | "clear" | "reset" | null;

function SettingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="settings-header">
      <button type="button" className="settings-back" onClick={onBack} aria-label="Back">
        <ArrowLeft size={21} aria-hidden="true" />
      </button>
      <div>
        <h1 id="settings-title" tabIndex={-1}>{title}</h1>
        {title === "Settings" ? <span>Local-first controls</span> : null}
      </div>
    </header>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-group">
      <h2>{title}</h2>
      <div className="settings-list">{children}</div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  summary,
  onClick,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  summary: string;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button type="button" className={`settings-row${tone === "danger" ? " danger" : ""}`} onClick={onClick}>
      <span className="settings-row-icon"><Icon size={18} aria-hidden="true" /></span>
      <span className="settings-row-copy"><strong>{title}</strong><small>{summary}</small></span>
      <ChevronRight size={18} className="settings-chevron" aria-hidden="true" />
    </button>
  );
}

function ExternalSettingsRow({ icon: Icon, title, summary, href }: {
  icon: LucideIcon;
  title: string;
  summary: string;
  href: string;
}) {
  return (
    <a className="settings-row" href={href} target="_blank" rel="noreferrer">
      <span className="settings-row-icon"><Icon size={18} aria-hidden="true" /></span>
      <span className="settings-row-copy"><strong>{title}</strong><small>{summary}</small></span>
      <ExternalLink size={17} className="settings-chevron" aria-hidden="true" />
    </a>
  );
}

function ToggleRow({ title, summary, checked, onChange }: {
  title: string;
  summary: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span className="settings-row-copy"><strong>{title}</strong><small>{summary}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="settings-toggle" aria-hidden="true" />
    </label>
  );
}

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Same as this device",
  light: "Light",
  dark: "Dark",
};

function SettingsHome({ open, theme }: { open: (page: SettingsPage) => void; theme: ThemePreference }) {
  const { state } = useStore();
  const auth = useCloudAuth();
  const accountSummary = auth.status === "signedIn"
    ? auth.email ?? "Signed in"
    : auth.configured ? "Optional email sign-in" : "Local profile only";

  return (
    <div className="settings-home">
      <SettingsGroup title="Profile">
        <SettingsRow icon={UserRound} title={state.me.name} summary="Handle and avatar" onClick={() => open("profile")} />
      </SettingsGroup>
      <SettingsGroup title="Account">
        <SettingsRow icon={KeyRound} title="Account" summary={accountSummary} onClick={() => open("account")} />
      </SettingsGroup>
      <SettingsGroup title="Appearance">
        <SettingsRow icon={SunMoon} title="Theme" summary={THEME_LABELS[theme]} onClick={() => open("appearance")} />
      </SettingsGroup>
      <SettingsGroup title="Notifications">
        <SettingsRow icon={Bell} title="Notification choices" summary="Categories and quiet hours" onClick={() => open("notifications")} />
      </SettingsGroup>
      <SettingsGroup title="Privacy & Safety">
        <SettingsRow icon={ShieldCheck} title="Privacy & Safety" summary="Data practices and circle rules" onClick={() => open("privacy")} />
      </SettingsGroup>
      <SettingsGroup title="Data">
        <SettingsRow icon={Database} title="Local data" summary={`${state.circles.length} ${plural(state.circles.length, "Circle")} · ${state.baras.length} Bara`} onClick={() => open("data")} />
      </SettingsGroup>
      <SettingsGroup title="Help">
        <SettingsRow icon={CircleHelp} title="Help & support" summary="Replay the intro or contact support" onClick={() => open("help")} />
      </SettingsGroup>
      <SettingsGroup title="About">
        <SettingsRow icon={Info} title="About Falò" summary={`Version ${APP_VERSION}`} onClick={() => open("about")} />
      </SettingsGroup>
    </div>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function AppearanceSettings({ theme, update }: {
  theme: ThemePreference;
  update: (theme: ThemePreference) => void;
}) {
  return (
    <section className="settings-page">
      <div className="settings-notice">
        <SunMoon size={20} aria-hidden="true" />
        <span><strong>Choose how Falò looks</strong><small>The change applies immediately and stays on this device.</small></span>
      </div>
      <SettingsGroup title="Theme">
        <fieldset className="theme-picker" aria-label="Color theme">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label className="theme-option" key={value}>
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => update(value)}
              />
              <span><Icon size={19} aria-hidden="true" /><strong>{label}</strong></span>
            </label>
          ))}
        </fieldset>
      </SettingsGroup>
      <p className="settings-footnote">System follows your phone or browser appearance automatically.</p>
    </section>
  );
}

function ProfileSettings({ onDirtyChange, onCancel }: {
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
}) {
  const { state, dispatch } = useStore();
  const auth = useCloudAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (name: string, avatar: string) => {
    setSaving(true);
    setError(null);
    try {
      if (auth.status === "signedIn") await updateRemoteProfile(name, avatar);
      if (!saveProfile({ id: state.me.id, name, avatar })) {
        throw new Error(auth.status === "signedIn"
          ? "Cloud profile updated, but this device could not save it. Retry when local storage is available."
          : "This device could not save your profile. Check browser storage and try again.");
      }
      onDirtyChange(false);
      dispatch({ type: "SET_PROFILE", name, avatar });
      dispatch({ type: "SETTINGS_BACK" });
      dispatch({ type: "TOAST", msg: "Profile updated" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profile update failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="settings-page profile-settings">
      <div className="settings-profile-preview">
        <span className="ava">{state.me.avatar}</span>
        <span><strong>{state.me.name}</strong><small>{auth.status === "signedIn" ? "Cloud account connected" : "Saved on this device"}</small></span>
      </div>
      <ProfileForm
        initialName={state.me.name}
        initialAvatar={state.me.avatar}
        submitLabel={saving ? "Saving…" : "Save profile"}
        submitting={saving}
        error={error}
        onSubmit={(name, avatar) => { void submit(name, avatar); }}
        onCancel={onCancel}
        onDirtyChange={onDirtyChange}
      />
    </section>
  );
}

function AccountSettings() {
  const auth = useCloudAuth();
  return (
    <section className="settings-page">
      {!auth.configured ? (
        <div className="settings-notice">
          <CloudOff size={20} aria-hidden="true" />
          <span><strong>Local profile</strong><small>No cloud account is connected in this build.</small></span>
        </div>
      ) : null}
      <CloudAccountCard />
      <p className="settings-footnote">
        Local activity is not silently uploaded. When you are signed in, use Delete account to permanently remove your cloud account and its data. Resetting this app only clears this device.
      </p>
    </section>
  );
}

function NotificationSettings({ preferences, update }: {
  preferences: Preferences;
  update: (changes: Partial<Preferences["notifications"]>) => void;
}) {
  const notification = preferences.notifications;
  return (
    <section className="settings-page">
      <div className="settings-notice">
        <Bell size={20} aria-hidden="true" />
        <span><strong>Choices saved locally</strong><small>Notification delivery is not connected in this build.</small></span>
      </div>
      <SettingsGroup title="Categories">
        <ToggleRow title="Invites and joins" summary="New circle invitations and accepted invites" checked={notification.invites} onChange={(invites) => update({ invites })} />
        <ToggleRow title="Expiry votes" summary="A room is close to fading" checked={notification.expiryVotes} onChange={(expiryVotes) => update({ expiryVotes })} />
        <ToggleRow title="Room activity" summary="A bundled summary, never every message" checked={notification.roomActivity} onChange={(roomActivity) => update({ roomActivity })} />
      </SettingsGroup>
      <SettingsGroup title="Quiet hours">
        <ToggleRow title="Use quiet hours" summary="Hold non-urgent notifications overnight" checked={notification.quietHoursEnabled} onChange={(quietHoursEnabled) => update({ quietHoursEnabled })} />
        {notification.quietHoursEnabled ? (
          <div className="quiet-hours">
            <label>From<input type="time" value={notification.quietStart} onChange={(event) => update({ quietStart: event.target.value })} /></label>
            <label>Until<input type="time" value={notification.quietEnd} onChange={(event) => update({ quietEnd: event.target.value })} /></label>
          </div>
        ) : null}
      </SettingsGroup>
    </section>
  );
}

function PrivacySettings({ open }: { open: (page: SettingsPage) => void }) {
  return (
    <section className="settings-page">
      <div className="settings-notice">
        <ShieldCheck size={20} aria-hidden="true" />
        <span><strong>Private by default</strong><small>No contact upload, precise location, public followers, or ad tracking.</small></span>
      </div>
      <SettingsGroup title="Policies">
        <SettingsRow icon={FileText} title="Privacy Policy" summary="What Falò stores and why" onClick={() => open("privacy-policy")} />
        <SettingsRow icon={UsersRound} title="Community Guidelines" summary="Boundaries for every private circle" onClick={() => open("guidelines")} />
      </SettingsGroup>
      <p className="settings-footnote">Block and report a member from their Circle profile, or report a message from the chat. Reports are reviewed by the team.</p>
    </section>
  );
}

function DataSettings({ onClear, onReset }: { onClear: () => void; onReset: () => void }) {
  const { state } = useStore();
  return (
    <section className="settings-page">
      <div className="data-summary" aria-label="Local activity summary">
        <span><strong>{state.circles.length}</strong><small>{plural(state.circles.length, "Circle")}</small></span>
        <span><strong>{state.rooms.length}</strong><small>{plural(state.rooms.length, "room")}</small></span>
        <span><strong>{state.baras.length}</strong><small>Bara</small></span>
      </div>
      <SettingsGroup title="Local activity">
        <button type="button" className="settings-action danger" onClick={onClear}>
          <Trash2 size={18} aria-hidden="true" />
          <span><strong>Clear local activity</strong><small>Remove Circles, rooms, messages, sparks, and Bara. Keep your profile.</small></span>
        </button>
      </SettingsGroup>
      <SettingsGroup title="This app">
        <button type="button" className="settings-action danger" onClick={onReset}>
          <RotateCcw size={18} aria-hidden="true" />
          <span><strong>Reset app</strong><small>Remove local activity, profile, onboarding, and preferences.</small></span>
        </button>
      </SettingsGroup>
      <p className="settings-footnote">These actions affect this device only. They do not delete a separate cloud account.</p>
    </section>
  );
}

function HelpSettings({ replay }: { replay: () => void }) {
  return (
    <section className="settings-page">
      <SettingsGroup title="Learn">
        <SettingsRow icon={RotateCcw} title="Replay introduction" summary="Rooms, expiry votes, and Bara" onClick={replay} />
      </SettingsGroup>
      <SettingsGroup title="Support">
        <ExternalSettingsRow icon={Mail} title="Contact support" summary="Open the public project issue form; do not include private data" href={SUPPORT_URL} />
      </SettingsGroup>
    </section>
  );
}

function AboutSettings({ open }: { open: (page: SettingsPage) => void }) {
  return (
    <section className="settings-page">
      <div className="about-mark" aria-label={`Falò version ${APP_VERSION}`}>
        <span aria-hidden="true">🔥</span><strong>Falò</strong><small>Version {APP_VERSION} · local alpha</small>
      </div>
      <SettingsGroup title="Documents">
        <SettingsRow icon={Scale} title="Terms of Use" summary="Rules for using the alpha" onClick={() => open("terms")} />
        <SettingsRow icon={PackageOpen} title="Open-source licenses" summary="Libraries that make Falò possible" onClick={() => open("licenses")} />
      </SettingsGroup>
    </section>
  );
}

export function SettingsScreen() {
  const { state, dispatch } = useStore();
  const current = state.settingsStack[state.settingsStack.length - 1] ?? "home";
  const [preferences, setPreferences] = useState(loadPreferences);
  const [profileDirty, setProfileDirty] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  const navigateBack = () => {
    if (current === "profile" && profileDirty) {
      setConfirmation("discard");
      return;
    }
    setProfileDirty(false);
    dispatch({ type: "SETTINGS_BACK" });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || confirmation) return;
      event.preventDefault();
      navigateBack();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("settings-scroll")?.scrollTo({ top: 0 });
      document.getElementById("settings-title")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [current]);

  const open = (page: SettingsPage) => dispatch({ type: "OPEN_SETTINGS_PAGE", page });
  const updateNotifications = (changes: Partial<Preferences["notifications"]>) => {
    const next = {
      ...preferences,
      notifications: { ...preferences.notifications, ...changes },
    };
    if (savePreferences(next)) setPreferences(next);
    else dispatch({ type: "TOAST", msg: "Preference could not be saved" });
  };

  const updateTheme = (theme: ThemePreference) => {
    const next = { ...preferences, theme };
    if (savePreferences(next)) {
      setPreferences(next);
      applyThemePreference(theme);
    } else {
      dispatch({ type: "TOAST", msg: "Theme preference could not be saved" });
    }
  };

  const clearActivity = () => {
    setConfirmation(null);
    if (!clearAppState()) {
      dispatch({ type: "TOAST", msg: "Local activity could not be cleared" });
      return;
    }
    dispatch({ type: "CLEAR_LOCAL_ACTIVITY" });
  };

  const resetApp = () => {
    setConfirmation(null);
    if (!resetLocalStorage()) {
      dispatch({ type: "TOAST", msg: "App reset failed. Local storage may be unavailable." });
      return;
    }
    setPreferences(DEFAULT_PREFERENCES);
    applyThemePreference(DEFAULT_PREFERENCES.theme);
    dispatch({ type: "RESET_APP", userId: makeId("user"), now: Date.now() });
  };

  let content: ReactNode;
  switch (current) {
    case "home":
      content = <SettingsHome open={open} theme={preferences.theme} />;
      break;
    case "profile":
      content = <ProfileSettings onDirtyChange={setProfileDirty} onCancel={navigateBack} />;
      break;
    case "account":
      content = <AccountSettings />;
      break;
    case "appearance":
      content = <AppearanceSettings theme={preferences.theme} update={updateTheme} />;
      break;
    case "notifications":
      content = <NotificationSettings preferences={preferences} update={updateNotifications} />;
      break;
    case "privacy":
      content = <PrivacySettings open={open} />;
      break;
    case "data":
      content = <DataSettings onClear={() => setConfirmation("clear")} onReset={() => setConfirmation("reset")} />;
      break;
    case "help":
      content = <HelpSettings replay={() => dispatch({ type: "REPLAY_INTRO" })} />;
      break;
    case "about":
      content = <AboutSettings open={open} />;
      break;
    default:
      content = <SettingsLegal kind={current as LegalPageKind} />;
  }

  const confirmationProps = confirmation === "discard"
    ? {
        title: "Discard profile changes?",
        body: "Your unsaved handle or avatar changes will be lost.",
        confirmLabel: "Discard",
        destructive: false,
        onConfirm: () => {
          setConfirmation(null);
          setProfileDirty(false);
          dispatch({ type: "SETTINGS_BACK" });
        },
      }
    : confirmation === "clear"
      ? {
          title: "Clear local activity?",
          body: "Circles, rooms, messages, sparks, and Bara on this device will be permanently removed. Your profile stays.",
          confirmLabel: "Clear activity",
          destructive: true,
          onConfirm: clearActivity,
        }
      : confirmation === "reset"
        ? {
            title: "Reset Falò?",
            body: "Everything Falò stores locally on this device will be removed and the introduction will start again.",
            confirmLabel: "Reset app",
            destructive: true,
            onConfirm: resetApp,
          }
        : null;

  return (
    <>
      <SettingsHeader title={PAGE_TITLES[current]} onBack={navigateBack} />
      <main className="settings-scroll" id="settings-scroll">{content}</main>
      {confirmationProps ? (
        <ConfirmDialog {...confirmationProps} onCancel={() => setConfirmation(null)} />
      ) : null}
    </>
  );
}