import { useState } from "react";

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
}: {
  initialName: string;
  initialAvatar: string;
  submitLabel: string;
  onSubmit: (name: string, avatar: string) => void;
  onCancel?: () => void;
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
      <input
        id="handle"
        className="field"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="e.g. dusk_fox"
        maxLength={16}
        autoComplete="off"
        autoFocus
      />
      <div className="field-label">Pick a face</div>
      <div className="ava-grid">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={"ava-opt" + (avatar === a ? " active" : "")}
            onClick={() => setAvatar(a)}
            aria-label={"avatar " + a}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="pform-actions">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <button type="button" className="btn-primary" disabled={!canSubmit} onClick={submit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
