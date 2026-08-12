import { useEffect, useState } from "react";
import { randomHandle } from "../lib/handles";

const AVATARS = [
  "🦊", "🐱", "🐼", "🐧", "🦁", "🐨",
  "🐸", "🐙", "🦄", "🐝", "🐢", "🦉",
  "🌸", "🎧", "⚡", "🌙", "🔥", "☕",
  "🎮", "📚", "🎨", "🏀", "🍜", "🛹",
];

export function ProfileForm({
  initialName,
  initialAvatar,
  submitLabel,
  onSubmit,
  onCancel,
  secondaryLabel = "Cancel",
  submitting = false,
  error,
  onDirtyChange,
  requireTerms = false,
}: {
  initialName: string;
  initialAvatar: string;
  submitLabel: string;
  onSubmit: (name: string, avatar: string) => void;
  onCancel?: () => void;
  secondaryLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onDirtyChange?: (dirty: boolean) => void;
  requireTerms?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [agreed, setAgreed] = useState(false);
  const canSubmit = name.trim().length > 0 && (!requireTerms || agreed);
  const dirty = name !== initialName || avatar !== initialAvatar;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const submit = () => {
    if (canSubmit && !submitting) onSubmit(name.trim(), avatar);
  };

  return (
    <div className="pform">
      <label className="field-label" htmlFor="handle">Your handle</label>
      <div className="handle-row">
        <input
          id="handle"
          name="handle"
          className="field"
          value={name}
          disabled={submitting}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          placeholder="e.g. dusk_fox"
          maxLength={16}
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
        <button
          type="button"
          className="handle-random"
          title="Generate a random handle"
          aria-label="Generate a random handle"
          onClick={() => setName(randomHandle(name))}
          disabled={submitting}
        >
          <span aria-hidden="true">🎲</span> Random
        </button>
      </div>
      <div className="field-label">Pick a face</div>
      <div className="ava-grid">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={"ava-opt" + (avatar === a ? " active" : "")}
            onClick={() => setAvatar(a)}
            disabled={submitting}
            aria-label={"avatar " + a}
            aria-pressed={avatar === a}
          >
            {a}
          </button>
        ))}
      </div>
      {error ? <div className="profile-save-error" role="alert">{error}</div> : null}
      {requireTerms && (
        <label className="terms-agree">
          <input
            type="checkbox"
            checked={agreed}
            disabled={submitting}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          <span className="terms-agree-text">
            I'm 18 or older and agree to Falò's <strong>Community Guidelines</strong> and <strong>Terms</strong>.
            No harassment, hate, or illegal content — anyone can be reported or blocked.
          </span>
        </label>
      )}
      <div className="pform-actions">
        {onCancel && (
          <button type="button" className="btn-ghost" disabled={submitting} onClick={onCancel}>{secondaryLabel}</button>
        )}
        <button type="button" className="btn-primary" disabled={!canSubmit || submitting} onClick={submit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
