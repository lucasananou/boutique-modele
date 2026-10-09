"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type {
  Stripe,
  StripeElements,
  StripeElementLocale,
  StripePaymentElement,
} from "@stripe/stripe-js";
import type { Locale } from "@/lib/i18n";

/**
 * Payment Element en mode « deferred intent ».
 *
 * Les champs carte sont montés à partir du seul montant du panier : aucun
 * aller-retour serveur n'est nécessaire pour les afficher, et le PaymentIntent
 * n'est créé qu'au moment où la cliente valide. Autrement dit, une visite du
 * checkout sans achat ne laisse ni commande PENDING ni intent orphelin.
 *
 * Les champs vivent dans des iframes servies par Stripe : le numéro de carte ne
 * transite jamais par notre code ni par nos serveurs (conformité PCI SAQ-A).
 */

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/** Habillage des champs Stripe avec les tokens de la charte. */
const appearance = {
  variables: {
    colorPrimary: "#6f5b46",
    colorBackground: "#ffffff",
    colorText: "#16130f",
    colorTextSecondary: "#6f6a60",
    colorDanger: "#b3261e",
    fontFamily: "Jost, ui-sans-serif, sans-serif",
    fontSizeBase: "15px",
    borderRadius: "2px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(22,19,15,.2)",
      boxShadow: "none",
      padding: "13px 14px",
    },
    ".Input:focus": { border: "1px solid #6f5b46", boxShadow: "none" },
    ".Label": { color: "#6f6a60", fontSize: "12px" },
  },
} as const;

/** Ce que le serveur doit renvoyer pour que le paiement puisse être confirmé. */
export interface PreparedPayment {
  clientSecret: string;
  returnUrl: string;
}

export function useStripePayment({
  amount,
  locale,
  genericError,
  enabled,
}: {
  amount: number;
  locale: Locale;
  genericError: string;
  /** Faux tant que le panier n'est pas hydraté : le nœud de montage n'existe
   *  pas encore et le montant n'est pas connu. */
  enabled: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const elementRef = useRef<StripePaymentElement | null>(null);
  // Le montant est lu au moment du paiement : pas de remontage à chaque
  // changement de quantité.
  const amountRef = useRef(amount);

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = Boolean(stripePromise);

  // Déclaré AVANT l'effet de montage : les effets s'exécutent dans l'ordre de
  // déclaration, le montant est donc à jour quand les Elements sont créés.
  // Répercute aussi les changements de panier ou de remise.
  useEffect(() => {
    amountRef.current = amount;
    if (ready && amount >= 50) elementsRef.current?.update({ amount });
  }, [amount, ready]);

  // Montage unique. Stripe exige un montant valide dès la création.
  useEffect(() => {
    if (!enabled || !stripePromise || amountRef.current < 50) return;
    let cancelled = false;

    stripePromise.then((stripe) => {
      if (!stripe || cancelled || !mountRef.current) return;
      stripeRef.current = stripe;
      const elements = stripe.elements({
        mode: "payment",
        amount: amountRef.current,
        currency: "eur",
        appearance,
        locale: locale as StripeElementLocale,
      });
      const element = elements.create("payment", { layout: "tabs" });
      element.on("ready", () => !cancelled && setReady(true));
      element.mount(mountRef.current);
      elementsRef.current = elements;
      elementRef.current = element;
    });

    return () => {
      cancelled = true;
      elementRef.current?.unmount();
      elementRef.current = null;
      elementsRef.current = null;
      setReady(false);
    };
  }, [locale, enabled]);

  /**
   * Valide la saisie, demande au serveur de créer la commande et l'intent,
   * puis confirme. En cas de succès Stripe redirige vers `returnUrl` ; la main
   * n'est rendue que sur échec.
   */
  const pay = useCallback(
    async (prepare: () => Promise<PreparedPayment | null>) => {
      const stripe = stripeRef.current;
      const elements = elementsRef.current;
      if (!stripe || !elements || submitting) return;

      setSubmitting(true);
      setError(null);

      // Validation des champs carte AVANT de créer quoi que ce soit côté
      // serveur : une carte incomplète ne doit pas générer de commande.
      const validation = await elements.submit();
      if (validation.error) {
        setError(validation.error.message ?? genericError);
        setSubmitting(false);
        return;
      }

      const prepared = await prepare();
      if (!prepared) {
        setSubmitting(false);
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret: prepared.clientSecret,
        confirmParams: { return_url: prepared.returnUrl },
      });

      if (result.error) setError(result.error.message ?? genericError);
      setSubmitting(false);
    },
    [genericError, submitting],
  );

  return { mountRef, ready, submitting, error, setError, pay, available };
}
