import { useState } from "react";
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
}: {
  initialName: string;
  initialAvatar: string;
  submitLabel: string;
  onSubmit: (name: string, avatar: string) => void;
  onCancel?: () => void;
  secondaryLabel?: string;
}) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (canSubmit) onSubmit(name.trim(), avatar);
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
            aria-label={"avatar " + a}
            aria-pressed={avatar === a}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="pform-actions">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>{secondaryLabel}</button>
        )}
        <button type="button" className="btn-primary" disabled={!canSubmit} onClick={submit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
