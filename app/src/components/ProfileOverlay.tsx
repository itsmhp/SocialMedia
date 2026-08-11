import { useEffect, useState } from "react";
import { useStore } from "../data/store";
import { saveProfile } from "../lib/profile";
import { ProfileForm } from "./ProfileForm";
import { useDialogFocus } from "../lib/useDialogFocus";
import { OnboardingIntro } from "./OnboardingIntro";

/** First-run onboarding + later profile editing, over the whole phone frame. */
export function ProfileOverlay() {
  const { state, dispatch } = useStore();
  const firstRun = !state.onboarded;
  const [introComplete, setIntroComplete] = useState(false);
  const [introPage, setIntroPage] = useState(0);
  const showingIntro = firstRun && !introComplete;
  const close = firstRun ? () => setIntroComplete(false) : () => dispatch({ type: "CLOSE_PROFILE_EDIT" });
  const dialogRef = useDialogFocus(!state.onboarded || state.editingProfile, close);

  useEffect(() => {
    if (!showingIntro) return;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(".intro-skip")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showingIntro, dialogRef]);

  if (state.onboarded && !state.editingProfile) return null;

  const submit = (name: string, avatar: string) => {
    saveProfile({ id: state.me.id, name, avatar });
    dispatch({ type: "SET_PROFILE", name, avatar });
  };

  return (
    <div ref={dialogRef} className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title" tabIndex={-1}>
      {showingIntro ? (
        <OnboardingIntro
          index={introPage}
          onIndexChange={setIntroPage}
          onComplete={() => setIntroComplete(true)}
        />
      ) : (
        <div className="onb">
          <div className="onb-flame">🔥</div>
          <span className="eyebrow">{firstRun ? "Almost there" : "Settings"}</span>
          <h1 className="onb-title" id="profile-title">{firstRun ? "Make it yours" : "Your profile"}</h1>
          <p className="onb-sub">
            {firstRun
              ? "Pick a handle and a face. No real name needed — it's just how your circle sees you."
              : "Change how your circle sees you. Saved on this device."}
          </p>
          <ProfileForm
            initialName={firstRun ? "" : state.me.name}
            initialAvatar={state.me.avatar}
            submitLabel={firstRun ? "Enter Unggun 🔥" : "Save"}
            onSubmit={submit}
            onCancel={close}
            secondaryLabel={firstRun ? "Back" : "Cancel"}
          />
        </div>
      )}
    </div>
  );
}
