import type Stripe from "stripe";
import type { PricedLine } from "@/lib/orders";
import type { ShippingAddressInput } from "@/lib/address";

/**
 * Paramètres d'une session Stripe Checkout (fonction pure, testable sans
 * réseau). Mode `subscription` dès qu'une ligne est un abonnement : Stripe
 * facture alors l'abonnement ET les achats simples du panier sur la première
 * facture. Les lignes d'abonnement d'une même session doivent partager la même
 * fréquence (contrainte Stripe) : le checkout n'en accepte qu'une.
 */
export function buildCheckoutSessionParams(args: {
  items: PricedLine[];
  currency: string;
  customerId?: string;
  email: string;
  reference: string;
  orderId: string;
  shipping: ShippingAddressInput;
  shippingAmount: number;
  shippingLabel: string;
  couponId?: string;
  successUrl: string;
  cancelUrl: string;
  locale?: Stripe.Checkout.SessionCreateParams.Locale;
}): Stripe.Checkout.SessionCreateParams {
  const currency = args.currency.toLowerCase();
  const hasSubscription = args.items.some((i) => i.intervalDays);
  const address = {
    line1: args.shipping.line1,
    line2: args.shipping.line2 || undefined,
    city: args.shipping.city,
    state: args.shipping.state || undefined,
    postal_code: args.shipping.zip,
    country: args.shipping.country,
  };

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = args.items.map((i) => ({
    quantity: i.quantity,
    price_data: {
      currency,
      unit_amount: i.unitPrice,
      product_data: {
        name: i.name + (i.variantLabel ? ` — ${i.variantLabel}` : ""),
        metadata: { productId: i.productId, variantId: i.variantId ?? "" },
      },
      ...(i.intervalDays
        ? { recurring: { interval: "day" as const, interval_count: i.intervalDays } }
        : {}),
    },
  }));

  const metadata = { reference: args.reference, orderId: args.orderId };
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: hasSubscription ? "subscription" : "payment",
    ...(args.customerId ? { customer: args.customerId } : { customer_email: args.email }),
    line_items,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    metadata,
    ...(args.locale ? { locale: args.locale } : {}),
    ...(args.couponId ? { discounts: [{ coupon: args.couponId }] } : {}),
  };

  if (hasSubscription) {
    params.subscription_data = { metadata };
  } else {
    params.payment_intent_data = {
      metadata,
      shipping: { name: args.shipping.fullName, phone: args.shipping.phone || undefined, address },
    };
    // Frais de port : uniquement en mode paiement (Stripe ne les accepte pas en
    // mode abonnement — les abonnements sont livrés gratuitement).
    if (args.shippingAmount > 0) {
      params.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: args.shippingLabel,
            fixed_amount: { amount: args.shippingAmount, currency },
          },
        },
      ];
    }
  }
  return params;
}

/** Client Stripe porteur de l'adresse de livraison (abonnements, portail). */
export function buildCustomerParams(email: string, s: ShippingAddressInput): Stripe.CustomerCreateParams {
  const address = {
    line1: s.line1,
    line2: s.line2 || undefined,
    city: s.city,
    state: s.state || undefined,
    postal_code: s.zip,
    country: s.country,
  };
  return {
    email,
    name: s.fullName,
    phone: s.phone || undefined,
    address,
    shipping: { name: s.fullName, phone: s.phone || undefined, address },
  };
}
