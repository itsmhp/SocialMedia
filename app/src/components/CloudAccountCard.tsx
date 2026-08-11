import { useState, type FormEvent } from "react";
import { useCloudAuth } from "../lib/CloudAuthProvider";

export function CloudAccountCard() {
  const auth = useCloudAuth();
  const [email, setEmail] = useState("");

  if (!auth.configured) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void auth.requestMagicLink(email);
  };

  if (auth.status === "loading") {
    return <div className="cloud-account" role="status">Checking account…</div>;
  }

  if (auth.status === "signedIn" || auth.status === "signingOut") {
    return (
      <section className="cloud-account" aria-labelledby="cloud-account-title">
        <div className="cloud-account-copy">
          <strong id="cloud-account-title">Cloud account</strong>
          <span>{auth.email ?? "Signed in"}</span>
          <small>Account session ready. Rooms stay on this device until sync is enabled.</small>
        </div>
        <button className="btn-small" disabled={auth.status === "signingOut"} onClick={() => void auth.endSession()}>
          {auth.status === "signingOut" ? "Signing out…" : "Sign out"}
        </button>
      </section>
    );
  }

  if (auth.status === "emailSent") {
    return (
      <section className="cloud-account" aria-live="polite">
        <div className="cloud-account-copy">
          <strong>Check your email</strong>
          <span>{auth.email}</span>
          <small>Open the Unggun sign-in link on this device.</small>
        </div>
      </section>
    );
  }

  return (
    <section className="cloud-account cloud-account-form" aria-labelledby="cloud-account-title">
      <div className="cloud-account-copy">
        <strong id="cloud-account-title">Cloud account</strong>
        <small>Use an email magic link. No password or phone number.</small>
      </div>
      <form onSubmit={submit}>
        <label className="field-label" htmlFor="cloud-email">Email</label>
        <div className="cloud-email-row">
          <input
            id="cloud-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            className="field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com…"
          />
          <button className="btn-primary" disabled={!email.trim() || auth.status === "sending"}>
            {auth.status === "sending" ? "Sending…" : "Email link"}
          </button>
        </div>
      </form>
      {auth.error ? (
        <div className="form-error" role="alert">
          <span>{auth.error}</span>
          <button type="button" onClick={() => void auth.refresh()}>Retry</button>
        </div>
      ) : null}
    </section>
  );
}