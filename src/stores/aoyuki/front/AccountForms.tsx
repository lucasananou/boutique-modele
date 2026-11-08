"use client";

import { useActionState, useEffect } from "react";
import { manageSubscriptionAction, registerAction, signInAction, type FormState, type ManageState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, {});
  return (
    <form action={action} className="shop-card">
      <h2>Connexion</h2>
      <input type="hidden" name="next" value={next} />
      <div className="form-grid">
        <label className="full">
          E-mail
          <input className="shop-input" type="email" name="email" required autoComplete="email" />
        </label>
        <label className="full">
          Mot de passe
          <input className="shop-input" type="password" name="password" required autoComplete="current-password" />
        </label>
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn--sapin btn--wide" type="submit" disabled={pending}>
        {pending ? "Un instant…" : "Se connecter"}
      </button>
      <p className="fine" style={{ marginTop: 14, textAlign: "center" }}>
        Nouveau ici ? <a href="/compte/inscription">Créer un compte</a>. Un abonnement se gère aussi sans compte, via le lien de votre e-mail de commande.
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  return (
    <form action={action} className="shop-card">
      <h2>Créer un compte</h2>
      <div className="form-grid">
        <label className="full">
          Nom
          <input className="shop-input" name="name" required minLength={2} autoComplete="name" />
        </label>
        <label className="full">
          E-mail
          <input className="shop-input" type="email" name="email" required autoComplete="email" />
        </label>
        <label className="full">
          <span>Mot de passe <small>(8 caractères ou plus)</small></span>
          <input className="shop-input" type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn--sapin btn--wide" type="submit" disabled={pending}>
        {pending ? "Un instant…" : "Créer mon compte"}
      </button>
      <p className="fine" style={{ marginTop: 14, textAlign: "center" }}>
        Déjà un compte ? <a href="/compte/connexion">Se connecter</a>.
      </p>
    </form>
  );
}

/** Sauter, décaler, résilier : un clic chacun. */
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
            <button className="btn btn--sapin" name="action" value="resume" disabled={pending}>Garder mon abonnement</button>
          </form>
        ) : (
          <>
            <form action={action}>
              <input type="hidden" name="token" value={token} />
              <button className="btn btn--line" name="action" value="skip" disabled={pending}>Sauter la prochaine livraison (+{intervalDays} jours)</button>
            </form>
            <form action={action}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="action" value="reschedule" />
              <label className="fine" style={{ display: "grid", gap: 6 }}>
                Décaler au
                <input className="shop-input" type="date" name="date" defaultValue={nextDate} min={minDate} max={maxDate} required />
              </label>
              <button className="btn btn--line" disabled={pending}>Décaler la livraison</button>
            </form>
          </>
        )}
      </div>
      <div className="manage-actions">
        {!cancelAtPeriodEnd && (
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <button className="text-link" name="action" value="cancel" disabled={pending}>Résilier l’abonnement</button>
          </form>
        )}
        {portal && (
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <button className="text-link" name="action" value="portal" disabled={pending}>Carte et factures</button>
          </form>
        )}
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.message && !portalUrl && <p className="form-ok" role="status">{state.message}</p>}
    </div>
  );
}
