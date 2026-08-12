import { useEffect, useState } from "react";
import { useStore } from "../data/store";
import { saveProfile } from "../lib/profile";
import { acceptTerms } from "../lib/terms";
import { ProfileForm } from "./ProfileForm";
import { useDialogFocus } from "../lib/useDialogFocus";
import { OnboardingIntro } from "./OnboardingIntro";

/** First-run onboarding + later profile editing, over the whole phone frame. */
export function ProfileOverlay() {
  const { state, dispatch } = useStore();
  const firstRun = !state.onboarded;
  const [introComplete, setIntroComplete] = useState(false);
  const [introPage, setIntroPage] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const showingIntro = state.replayingIntro || (firstRun && !introComplete);
  const close = state.replayingIntro ? () => dispatch({ type: "FINISH_INTRO_REPLAY" }) : undefined;
  const dialogRef = useDialogFocus(firstRun || state.replayingIntro, close);

  useEffect(() => {
    if (!showingIntro) return;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(".intro-skip")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showingIntro, dialogRef]);

  if (state.onboarded && !state.replayingIntro) return null;

  const submit = (name: string, avatar: string) => {
    if (!saveProfile({ id: state.me.id, name, avatar })) {
      setSaveError("This device could not save your profile. Check browser storage and try again.");
      return;
    }
    if (firstRun) acceptTerms();
    setSaveError(null);
    dispatch({ type: "SET_PROFILE", name, avatar });
  };

  return (
    <div ref={dialogRef} className="overlay" role="dialog" aria-modal="true" aria-label={showingIntro ? "Introduction" : undefined} aria-labelledby={showingIntro ? undefined : "profile-title"} tabIndex={-1}>
      {showingIntro ? (
        <OnboardingIntro
          index={introPage}
          onIndexChange={setIntroPage}
          onComplete={() => {
            if (state.replayingIntro) dispatch({ type: "FINISH_INTRO_REPLAY" });
            else setIntroComplete(true);
          }}
        />
      ) : (
        <div className="onb">
          <div className="onb-flame">🔥</div>
          <span className="eyebrow">Almost there</span>
          <h1 className="onb-title" id="profile-title">Make it yours</h1>
          <p className="onb-sub">
            Pick a handle and a face. No real name needed — it's just how your circle sees you.
          </p>
          <ProfileForm
            initialName=""
            initialAvatar={state.me.avatar}
            submitLabel="Enter Falò 🔥"
            error={saveError}
            onSubmit={submit}
            onCancel={() => setIntroComplete(false)}
            secondaryLabel="Back"
            requireTerms={firstRun}
          />
        </div>
      )}
    </div>
  );
}
