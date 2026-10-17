"use client";

import { useActionState, useEffect } from "react";
import {
  manageSubscriptionAction,
  registerAction,
  signInAction,
  type FormState,
  type ManageState,
} from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, {});
  return (
    <form action={action} className="shop-card">
      <h2>Sign in</h2>
      <input type="hidden" name="next" value={next} />
      <div className="form-grid">
        <label className="full">
          Email
          <input className="field" type="email" name="email" required autoComplete="email" />
        </label>
        <label className="full">
          Password
          <input className="field" type="password" name="password" required autoComplete="current-password" />
        </label>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="pill wide-btn" type="submit" disabled={pending}>
        {pending ? "One moment…" : "Sign in"}
      </button>
      <p className="fine" style={{ marginTop: 14, textAlign: "center" }}>
        New here? <a href="/account/register" style={{ textDecoration: "underline" }}>Create an account</a>. No account needed to
        manage a subscription: use the link in your order email.
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  return (
    <form action={action} className="shop-card">
      <h2>Create an account</h2>
      <div className="form-grid">
        <label className="full">
          Name
          <input className="field" name="name" required minLength={2} autoComplete="name" />
        </label>
        <label className="full">
          Email
          <input className="field" type="email" name="email" required autoComplete="email" />
        </label>
        <label className="full">
          <span>
            Password <small>(8 characters or more)</small>
          </span>
          <input className="field" type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="pill wide-btn" type="submit" disabled={pending}>
        {pending ? "One moment…" : "Create my account"}
      </button>
      <p className="fine" style={{ marginTop: 14, textAlign: "center" }}>
        Already have one? <a href="/account/login" style={{ textDecoration: "underline" }}>Sign in</a>.
      </p>
    </form>
  );
}

/** Sauter, décaler, résilier : un clic chacun (promis sur le site). */
export function ManageSubscription({
  token,
  cancelAtPeriodEnd,
  nextDate,
  minDate,
  maxDate,
  intervalDays,
  portal,
}: {
  token: string;
  cancelAtPeriodEnd: boolean;
  nextDate: string;
  minDate: string;
  maxDate: string;
  intervalDays: number;
  portal: boolean;
}) {
  const [state, action, pending] = useActionState<ManageState, FormData>(manageSubscriptionAction, {});
  const portalUrl = state.message?.startsWith("https://") ? state.message : null;
  useEffect(() => {
    if (portalUrl) window.location.href = portalUrl;
  }, [portalUrl]);
  return (
    <div>
      <div className="manage-actions">
        {cancelAtPeriodEnd ? (
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <button className="pill" name="action" value="resume" disabled={pending}>
              Keep my subscription
            </button>
          </form>
        ) : (
          <>
            <form action={action}>
              <input type="hidden" name="token" value={token} />
              <button className="pill" name="action" value="skip" disabled={pending}>
                Skip next delivery (+{intervalDays} days)
              </button>
            </form>
            <form action={action}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="action" value="reschedule" />
              <label className="fine" style={{ display: "grid", gap: 6 }}>
                Move it to
                <input className="field" type="date" name="date" defaultValue={nextDate} min={minDate} max={maxDate} required />
              </label>
              <button className="pill outline" disabled={pending}>
                Move delivery
              </button>
            </form>
          </>
        )}
      </div>
      <div className="manage-actions">
        {!cancelAtPeriodEnd && (
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <button className="text-link" name="action" value="cancel" disabled={pending}>
              Cancel subscription
            </button>
          </form>
        )}
        {portal && (
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <button className="text-link" name="action" value="portal" disabled={pending}>
              Update card or download invoices
            </button>
          </form>
        )}
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && !portalUrl && (
        <p className="form-ok" role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
