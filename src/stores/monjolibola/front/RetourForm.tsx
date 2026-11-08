"use client";

import { useState } from "react";
import { demandeRetour } from "./actions";

export default function RetourForm() {
  const [etat, setEtat] = useState<{ ok?: boolean; error?: string }>({});
  async function envoyer(fd: FormData) {
    const r = await demandeRetour({ type: fd.get("type"), email: fd.get("email"), reference: fd.get("reference") || undefined, message: fd.get("message") || undefined });
    setEtat(r);
  }
  if (etat.ok) return <p className="form-ok">Votre demande a bien été transmise.</p>;
  return (
    <form action={envoyer} className="form-grid">
      <label className="full">Votre demande<select className="shop-input" name="type" defaultValue="Rétractation"><option>Rétractation</option><option>Retour</option></select></label>
      <label className="full">E-mail<input className="shop-input" name="email" type="email" required /></label>
      <label className="full">Numéro de commande<input className="shop-input" name="reference" /></label>
      <label className="full">Message<textarea className="shop-input" name="message" rows={4} /></label>
      <div className="full"><button className="btn btn--plein" type="submit">Envoyer</button>{etat.error && <p className="form-error">{etat.error}</p>}</div>
    </form>
  );
}
