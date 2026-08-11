import { useStore } from "../data/store";
import { saveProfile } from "../lib/profile";
import { ProfileForm } from "./ProfileForm";
import { useDialogFocus } from "../lib/useDialogFocus";

/** First-run onboarding + later profile editing, over the whole phone frame. */
export function ProfileOverlay() {
  const { state, dispatch } = useStore();
  const firstRun = !state.onboarded;
  const close = firstRun ? undefined : () => dispatch({ type: "CLOSE_PROFILE_EDIT" });
  const dialogRef = useDialogFocus(!state.onboarded || state.editingProfile, close);

  if (state.onboarded && !state.editingProfile) return null;

  const submit = (name: string, avatar: string) => {
    saveProfile({ id: state.me.id, name, avatar });
    dispatch({ type: "SET_PROFILE", name, avatar });
  };

  return (
    <div ref={dialogRef} className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title" tabIndex={-1}>
      <div className="onb">
        <div className="onb-flame">🔥</div>
        <h1 className="onb-title" id="profile-title">{firstRun ? "Welcome to Unggun" : "Your profile"}</h1>
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
        />
      </div>
    </div>
  );
}
