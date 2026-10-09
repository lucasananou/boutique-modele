import { Resend } from "resend";
import { brand } from "@/lib/brand";
import { adminEmails } from "@/lib/roles";
// Les liens suivent la langue de la commande : un e-mail anglais doit renvoyer
// sur le domaine international, pas sur le `.fr`.
import { originForLocale } from "@/lib/site";
import { formatMoney } from "@/lib/currency";
import { localizedPath, localeConfig, type Locale } from "@/lib/i18n";
import { interpolate, t } from "@/lib/translations";
import { store } from "@/stores";

const apiKey = process.env.RESEND_API_KEY;

/** Resend est actif uniquement si une vraie clé est configurée. */
export const isEmailLive = Boolean(apiKey && !apiKey.includes("xxx"));

const resend = isEmailLive ? new Resend(apiKey) : null;

const FROM =
  process.env.EMAIL_FROM ?? store.emailFromFallback;

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Envoi bas niveau. Sans clé Resend → no-op loggé (clé-ready : le code marche,
 * il suffit de fournir RESEND_API_KEY + EMAIL_FROM pour activer l'envoi réel).
 */
async function send({ to, subject, html }: SendArgs): Promise<boolean> {
  if (!resend) {
    console.info(`[email:démo] « ${subject} » → ${Array.isArray(to) ? to.join(", ") : to}`);
    return false;
  }
  try {
    // Resend ne lève pas d'exception quand il refuse l'envoi (expéditeur ou
    // domaine invalide…) : il renvoie `error`. Sans ce contrôle, les échecs
    // passaient inaperçus.
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo: brand.contact.email,
    });
    if (error) {
      console.error(`[email] refusé par Resend (« ${subject} ») :`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] échec d'envoi:", e);
    return false;
  }
}

/* ---------- Gabarit ---------- */

function layout(title: string, body: string, preheader?: string, locale: Locale = "fr"): string {
  const config = localeConfig[locale];
  // Texte d'aperçu (preheader) : ce que la boîte mail affiche à côté de l'objet.
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>`
    : "";
  return `<!doctype html><html lang="${config.htmlLang}" dir="${config.dir}"><body style="margin:0;background:#efe8dc;padding:32px 0;font-family:Georgia,'Times New Roman',serif;color:#211c17;">${pre}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#f7f3eb;border-radius:6px;overflow:hidden;">
    <tr><td style="background:#211c17;padding:26px 36px;">
      <span style="font-size:20px;letter-spacing:0.34em;color:#f7f3eb;">${brand.name}</span>
    </td></tr>
    <tr><td style="padding:36px;">
      <h1 style="font-size:24px;font-weight:normal;margin:0 0 18px;color:#211c17;">${title}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:24px 36px;border-top:1px solid rgba(33,28,23,0.1);font-family:Arial,sans-serif;font-size:12px;color:#8a8175;">
      ${brand.legalName} — ${brand.contact.address.street}, ${brand.contact.address.zip} ${brand.contact.address.city}<br>
      ${brand.contact.phone} · ${brand.contact.email}
    </td></tr>
  </table>
  </td></tr></table></body></html>`;
}

const p = (t: string) =>
  `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#534b40;margin:0 0 14px;">${t}</p>`;

/** Gros bouton d'action (table-based pour la compat clients mail). */
const cta = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;"><tr>
    <td style="border-radius:4px;background:#211c17;">
      <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#f7f3eb;text-decoration:none;">${label}</a>
    </td>
  </tr></table>`;

/** Bandeau de réassurance discret (livraison / retours / paiement). */
const reassurance = (locale: Locale = "fr") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 2px;border-top:1px solid rgba(33,28,23,0.1);">
    <tr><td align="center" style="padding:15px 4px 0;font-family:Arial,sans-serif;font-size:11.5px;color:#8a8175;line-height:1.6;">
      ${t(locale).email.reassurance}
    </td></tr>
  </table>`;

/** Encart mettant en valeur le code promo. */
const promoBox = (code: string, locale: Locale = "fr") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0;"><tr>
    <td style="border:1.5px dashed #a98a55;border-radius:8px;padding:13px 30px;text-align:center;">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a8175;margin-bottom:5px;">${t(locale).email.promoLabel}</div>
      <div style="font-family:Arial,sans-serif;font-size:23px;letter-spacing:0.16em;color:#211c17;font-weight:bold;">${code}</div>
    </td>
  </tr></table>`;

interface OrderForEmail {
  reference: string;
  email: string;
  amountTotal: number;
  /** Devise reellement facturee : les montants sont dans ses unites mineures. */
  currency?: string;
  discountAmount?: number;
  giftWrap?: boolean;
  shippingName?: string | null;
  locale?: Locale;
  /** Suivi colis (e-mail d'expédition). */
  tracking?: { carrier: string; number: string; url?: string | null };
  items: {
    name: string;
    variantLabel?: string | null;
    engraving?: string | null;
    unitPrice: number;
    quantity: number;
  }[];
}

function itemsTable(o: OrderForEmail, locale: Locale = o.locale ?? "fr"): string {
  const copy = t(locale).email;
  const bb = "border-bottom:1px solid rgba(33,28,23,0.08);";
  const rows = o.items
    .map(
      (it) =>
        `<tr>
        <td style="padding:12px 0;${bb}vertical-align:top;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#211c17;margin-bottom:3px;">${it.name}</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#8a8175;">${it.variantLabel ? `${it.variantLabel} · ` : ""}${copy.quantity} ${it.quantity}</div>
        </td>
        <td align="right" style="padding:12px 0;${bb}font-family:Arial,sans-serif;font-size:13.5px;color:#211c17;white-space:nowrap;vertical-align:top;">
          ${formatMoney(it.unitPrice * it.quantity, o.currency ?? "eur", locale)}
        </td></tr>`,
    )
    .join("");
  const discount =
    o.discountAmount && o.discountAmount > 0
      ? `<tr><td style="padding:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#a98a55;">${copy.discount}</td><td align="right" style="padding:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#a98a55;">−${formatMoney(o.discountAmount, o.currency ?? "eur", locale)}</td></tr>`
      : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
    ${rows}
    ${discount}
    <tr><td style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#211c17;">${copy.total}</td>
    <td align="right" style="padding:14px 0 0;font-size:16px;color:#211c17;">${formatMoney(o.amountTotal, o.currency ?? "eur", locale)}</td></tr>
  </table>`;
}

/* ---------- E-mails transactionnels ---------- */

export async function sendOrderConfirmation(o: OrderForEmail) {
  const locale = o.locale ?? "fr";
  const copy = t(locale).email;
  const first = o.shippingName ? ` ${o.shippingName.split(" ")[0]}` : "";
  await send({
    to: o.email,
    subject: interpolate(copy.orderSubject, { reference: o.reference }),
    html: layout(
      copy.orderTitle,
      p(interpolate(copy.orderIntro, { first, reference: o.reference })) +
        itemsTable(o, locale) +
        (o.giftWrap ? p(copy.gift) : "") +
        p(copy.orderOutro),
      undefined,
      locale,
    ),
  });
}

export async function sendAdminNewOrder(o: OrderForEmail) {
  const admins = adminEmails();
  if (admins.length === 0) return;
  await send({
    to: admins,
    subject: `Nouvelle commande ${o.reference} — ${formatMoney(o.amountTotal, o.currency ?? "eur")}`,
    html: layout(
      "Nouvelle commande",
      p(`Commande <strong>${o.reference}</strong> de ${o.email}.`) +
        itemsTable(o) +
        p("Payée : à préparer et à expédier (pensez à saisir le numéro de suivi).") +
        cta(`${originForLocale("fr")}/admin/commandes`, "Voir la commande"),
    ),
  });
}

export async function sendShippingNotice(o: OrderForEmail) {
  const locale = o.locale ?? "fr";
  const copy = t(locale).email;
  const first = o.shippingName ? ` ${o.shippingName.split(" ")[0]}` : "";
  await send({
    to: o.email,
    subject: interpolate(copy.shippingSubject, { reference: o.reference }),
    html: layout(
      copy.shippingTitle,
      p(interpolate(copy.shippingIntro, { first, reference: o.reference })) +
        (o.tracking
          ? p(
              interpolate(copy.trackingLine, {
                carrier: escapeHtml(o.tracking.carrier),
                number: `<strong>${escapeHtml(o.tracking.number)}</strong>`,
              }),
            ) + (o.tracking.url ? cta(escapeHtml(o.tracking.url), copy.trackingCta) : "")
          : ""),
      undefined,
      locale,
    ),
  });
}

export async function sendWelcome(to: string, name?: string | null, locale: Locale = "fr") {
  const copy = t(locale).email;
  const first = name ? ` ${name.split(" ")[0]}` : "";
  await send({
    to,
    subject: interpolate(copy.welcomeSubject, { brand: brand.name }),
    html: layout(
      interpolate(copy.welcomeTitle, { brand: brand.name }),
      p(interpolate(copy.welcomeIntro, { first })) +
        p(interpolate(copy.welcomeOutro, { legalName: brand.legalName })),
      undefined,
      locale,
    ),
  });
}

export async function sendAppointmentRequest(data: {
  name: string;
  email: string;
  phone?: string;
  date?: string;
  type: string;
  message?: string;
  locale?: Locale;
}) {
  const locale = data.locale ?? "fr";
  const admins = adminEmails();
  // Notification interne
  if (admins.length > 0) {
    await send({
      to: admins,
      subject: `Demande de rendez-vous — ${data.name} (${data.type})`,
      html: layout(
        "Demande de rendez-vous",
        p(`<strong>${data.name}</strong> — ${data.email}${data.phone ? ` · ${data.phone}` : ""}`) +
          p(`Type : ${data.type}${data.date ? `<br>Date souhaitée : ${data.date}` : ""}`) +
          (data.message ? p(`« ${data.message} »`) : ""),
      ),
    });
  }
  // Accusé de réception au client
  const clientCopy =
    locale === "en"
      ? {
          subject: "Your request has been received",
          title: "Request received",
          intro: `Hello ${data.name.split(" ")[0]}, thank you for your message (${data.type}). Our team will get back to you within 24 hours.`,
        }
      : locale === "he"
        ? {
            subject: "הבקשה שלך התקבלה",
            title: "הבקשה התקבלה",
            intro: `שלום ${data.name.split(" ")[0]}, תודה על ההודעה שלך (${data.type}). הצוות שלנו יחזור אלייך תוך 24 שעות.`,
          }
        : {
            subject: "Votre demande de rendez-vous est bien reçue",
            title: "Demande bien reçue",
            intro: `Bonjour ${data.name.split(" ")[0]}, merci pour votre message (${data.type}). Notre équipe vous recontacte sous 24 h.`,
          };
  await send({
    to: data.email,
    subject: clientCopy.subject,
    html: layout(
      clientCopy.title,
      p(clientCopy.intro),
      undefined,
      locale,
    ),
  });
}

/* ---------- Relance panier abandonné ---------- */

/** Étapes de relance : 1 & 2 sans remise, 3 avec code promo −10 %. */
export type ReminderStep = 1 | 2 | 3;

interface CartReminderOrder extends OrderForEmail {
  /** Jeton opaque servant à reconstruire le lien de reprise. */
  confirmToken?: string | null;
  /** Code promo transmis à l'étape 3 (ex. « PANIER10 »). */
  promoCode?: string;
}

/**
 * Relance un panier abandonné (commande PENDING). Réutilise le gabarit,
 * l' item table et le bouton d'action. Le lien de reprise ré-hydrate le panier
 * côté boutique puis redirige vers /commande. No-op si Resend non configuré.
 */
export async function sendCartReminder(o: CartReminderOrder, step: ReminderStep): Promise<boolean> {
  const locale = o.locale ?? "fr";
  const copy = t(locale).email;
  const first = o.shippingName ? ` ${o.shippingName.split(" ")[0]}` : "";
  const firstItem = o.items[0]?.name ?? copy.cartTitle.toLowerCase();
  const promoCode = o.promoCode ?? store.promos.cartRecoveryCode;

  const params = new URLSearchParams({ ref: o.reference });
  if (o.confirmToken) params.set("token", o.confirmToken);
  if (step === 3) params.set("promo", promoCode);
  const resumeUrl = `${originForLocale(locale)}${localizedPath("/panier/reprendre", locale)}?${params.toString()}`;

  const subject = cartReminderSubject(step, firstItem, locale);

  const preheader = cartReminderPreheader(step, promoCode, locale);

  const intro = p(cartReminderIntro(step, first, promoCode, locale));

  const promo = step === 3 ? promoBox(promoCode, locale) : "";
  const outro =
    step === 3
      ? p(cartReminderOutro(promoCode, locale))
      : "";

  return send({
    to: o.email,
    subject,
    html: layout(
      copy.cartTitle,
      intro +
        itemsTable(o, locale) +
        cta(resumeUrl, copy.resumeCart) +
        promo +
        outro +
        reassurance(locale),
      preheader,
      locale,
    ),
  });
}

/**
 * E-mail immédiat après capture de l'e-mail au panier (visiteur non connecté
 * qui n'a pas encore commandé) : confirme que le panier est gardé, délivre le
 * code de réduction, et propose de reprendre. La relance (24h/72h) prend le
 * relais ensuite via le cron. No-op si Resend non configuré.
 */
export async function sendCartLeadWelcome(o: CartReminderOrder, promoCode: string) {
  const locale = o.locale ?? "fr";
  const copy = t(locale).email;
  const firstItem = o.items[0]?.name ?? copy.cartTitle.toLowerCase();
  const params = new URLSearchParams({ ref: o.reference });
  if (o.confirmToken) params.set("token", o.confirmToken);
  params.set("promo", promoCode);
  const resumeUrl = `${originForLocale(locale)}${localizedPath("/panier/reprendre", locale)}?${params.toString()}`;

  await send({
    to: o.email,
    subject: cartLeadSubject(promoCode, locale),
    html: layout(
      copy.cartTitle,
      p(cartLeadIntro(firstItem, o.items.length, promoCode, locale)) +
        promoBox(promoCode, locale) +
        itemsTable(o, locale) +
        cta(resumeUrl, copy.resumeCart) +
        reassurance(locale),
      cartLeadPreheader(promoCode, locale),
      locale,
    ),
  });
}

function cartReminderSubject(step: ReminderStep, firstItem: string, locale: Locale) {
  if (locale === "en") {
    if (step === 3) return `Last chance — 10% off your cart`;
    if (step === 2) return `"${firstItem}" is still waiting for you`;
    return `You left "${firstItem}" behind`;
  }
  if (locale === "he") {
    if (step === 3) return `הזדמנות אחרונה — 10% הנחה לעגלה`;
    if (step === 2) return `״${firstItem}״ עדיין מחכה לך`;
    return `השארת את ״${firstItem}״ בעגלה`;
  }
  if (step === 3) return `Dernière chance — −10 % sur votre panier`;
  if (step === 2) return `« ${firstItem} » vous attend toujours`;
  return `Vous avez oublié « ${firstItem} »`;
}

function cartReminderPreheader(step: ReminderStep, promoCode: string, locale: Locale) {
  if (locale === "en") {
    if (step === 3) return `Enjoy 10% off with code ${promoCode} — limited offer.`;
    if (step === 2) return `We kept your selection aside — finish in one click.`;
    return `Your selection is still available. Pick up where you left off.`;
  }
  if (locale === "he") {
    if (step === 3) return `קבלי 10% הנחה עם הקוד ${promoCode} — לזמן מוגבל.`;
    if (step === 2) return `שמרנו את הבחירה שלך בצד — סיום הזמנה בלחיצה.`;
    return `הבחירה שלך עדיין זמינה. חזרי מאיפה שהפסקת.`;
  }
  if (step === 3) return `Profitez de −10 % avec le code ${promoCode} — offre limitée.`;
  if (step === 2) return `Nous avons gardé votre sélection de côté — un clic pour finaliser.`;
  return `Votre sélection est toujours disponible, reprenez où vous en étiez.`;
}

function cartReminderIntro(step: ReminderStep, first: string, promoCode: string, locale: Locale) {
  if (locale === "en") {
    if (step === 3) return `Hello${first}, your selection is still here. To help you decide, enjoy <strong>10% off</strong> with the code below.`;
    if (step === 2) return `Hello${first}, your pieces are still waiting. We kept them aside so you can resume your order in one click.`;
    return `Hello${first}, you were almost there. Your cart is ready and only needs one click to complete.`;
  }
  if (locale === "he") {
    if (step === 3) return `שלום${first}, הבחירה שלך עדיין כאן. כדי לעזור לך להחליט, קבלי <strong>10% הנחה</strong> עם הקוד למטה.`;
    if (step === 2) return `שלום${first}, הפריטים שלך עדיין מחכים. שמרנו אותם כדי שתוכלי להשלים את ההזמנה בלחיצה.`;
    return `שלום${first}, כמעט סיימת. העגלה שלך מוכנה ונשארה רק לחיצה אחת.`;
  }
  if (step === 3) return `Bonjour${first}, votre sélection est encore là — mais nous ne pouvons pas la garder indéfiniment. Pour vous décider, profitez de <strong>−10 %</strong> avec le code ci-dessous.`;
  if (step === 2) return `Bonjour${first}, vos pièces vous attendent toujours. Nous les avons mises de côté — reprenez votre commande là où vous l'aviez laissée, en un clic.`;
  return `Bonjour${first}, vous étiez tout près. Votre panier est prêt : il ne manque qu'un clic pour le finaliser, en toute sérénité.`;
}

function cartReminderOutro(promoCode: string, locale: Locale) {
  if (locale === "en") return `Code <strong>${promoCode}</strong> is valid for a few days only.`;
  if (locale === "he") return `הקוד <strong>${promoCode}</strong> תקף לכמה ימים בלבד.`;
  return `Le code <strong>${promoCode}</strong> est valable quelques jours seulement.`;
}

function cartLeadSubject(promoCode: string, locale: Locale) {
  if (locale === "en") return `Your cart is saved — here is your 10% code`;
  if (locale === "he") return `העגלה שלך נשמרה — הנה קוד 10% שלך`;
  return `Votre panier est gardé — voici vos −10 %`;
}

function cartLeadIntro(firstItem: string, itemCount: number, promoCode: string, locale: Locale) {
  if (locale === "en") return `Thank you! We saved "${firstItem}"${itemCount > 1 ? " and the rest of your selection" : ""} for you. Enjoy <strong>10% off</strong> with code <strong>${promoCode}</strong> at checkout.`;
  if (locale === "he") return `תודה! שמרנו עבורך את ״${firstItem}״${itemCount > 1 ? " ואת שאר הבחירה שלך" : ""}. קבלי <strong>10% הנחה</strong> עם הקוד <strong>${promoCode}</strong> בתשלום.`;
  return `Merci ! Nous avons mis « ${firstItem} »${itemCount > 1 ? " et le reste de votre sélection" : ""} de côté pour vous. Pour vous décider en toute sérénité, profitez de <strong>−10 %</strong> avec ce code, à saisir au paiement :`;
}

function cartLeadPreheader(promoCode: string, locale: Locale) {
  if (locale === "en") return `Your 10% code (${promoCode}) and your cart are waiting.`;
  if (locale === "he") return `קוד 10% שלך (${promoCode}) והעגלה שלך מחכים.`;
  return `Votre code −10 % (${promoCode}) et votre panier vous attendent.`;
}

/** Échappe le HTML (contenu de message affiché dans un e-mail). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notifie la visiteuse (par e-mail) qu'elle a reçu une réponse au chat, quand
 * elle a quitté le site après avoir laissé son e-mail. No-op si Resend absent.
 */
export async function sendChatReply(
  to: string,
  body: string,
  name?: string | null,
  locale: Locale = "fr",
) {
  const copy = t(locale).email;
  const first = name ? ` ${name.split(" ")[0]}` : "";
  await send({
    to,
    subject: interpolate(copy.chatSubject, { brand: brand.name }),
    html: layout(
      copy.chatTitle,
      p(
        interpolate(copy.chatIntro, { first }),
      ) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;"><tr><td style="border-left:3px solid #a98a55;padding:6px 0 6px 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#211c17;white-space:pre-wrap;">${escapeHtml(
          body,
        )}</td></tr></table>` +
        p(
          copy.chatOutro,
        ),
      undefined,
      locale,
    ),
  });
}

export async function sendNewsletterWelcome(to: string, locale: Locale = "fr") {
  const copy = t(locale).email;
  await send({
    to,
    subject: interpolate(copy.newsletterSubject, { brand: brand.name }),
    html: layout(
      copy.newsletterTitle,
      p(copy.newsletterIntro),
      undefined,
      locale,
    ),
  });
}

/**
 * Prévient l'équipe (ADMIN_EMAILS) qu'une visiteuse a écrit sur le chat.
 * Appelé au premier message non lu d'une conversation, pas à chaque message.
 */
export async function sendAdminChatMessage(data: {
  body: string;
  email?: string | null;
  page?: string | null;
}) {
  const admins = adminEmails();
  if (admins.length === 0) return;
  await send({
    to: admins,
    subject: `Nouveau message sur le chat — ${brand.name}`,
    html: layout(
      "Nouveau message sur le chat",
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;"><tr><td style="border-left:3px solid #a98a55;padding:6px 0 6px 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#211c17;white-space:pre-wrap;">${escapeHtml(
        data.body,
      )}</td></tr></table>` +
        p(
          `${data.email ? `E-mail laissé : ${escapeHtml(data.email)}` : "Pas encore d'e-mail laissé (réponse visible seulement si elle revient sur le site)."}${
            data.page ? `<br>Page : ${escapeHtml(data.page)}` : ""
          }`,
        ) +
        cta(`${originForLocale("fr")}/admin/messages`, "Répondre dans l'admin"),
    ),
  });
}
