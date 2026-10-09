import { brand } from "@/lib/brand";
import { store } from "@/stores";
import { PageTitle, Card } from "@/components/admin/ui";

export const metadata = { title: "Paramètres" };

const inputStyle: React.CSSProperties = {
  background: "#FBFAF8",
  border: "1px solid rgba(20,21,26,0.1)",
  borderRadius: 10,
};

export default function AdminSettingsPage() {
  return (
    <div className="max-w-[620px]">
      <PageTitle title="Paramètres" subtitle="Configuration de la boutique." />

      <div className="flex flex-col gap-3.5">
        <Card className="px-6 py-[22px]">
          <Field label="Nom de la boutique" value={brand.name} />
        </Card>

        <div className="grid grid-cols-2 gap-3.5">
          <Card className="px-6 py-[22px]">
            <Field label="Identifiant boutique" value={store.id} mono />
          </Card>
          <Card className="px-6 py-[22px]">
            <Field label="Préfixe des commandes" value={`${store.orders.prefix}-${new Date().getFullYear()}-0001`} mono />
          </Card>
        </div>

        <Card className="px-6 py-[22px]">
          <Field label="Domaine principal" value={store.domains.primary} mono />
          <div className="mt-[18px]">
            <Field
              label="Vendeur légal"
              value={store.seller?.name ?? "À renseigner (config boutique)"}
            />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3.5">
          <Card className="px-6 py-[22px]">
            <Field label="Devise" value="EUR (€)" />
          </Card>
          <Card className="px-6 py-[22px]">
            <Field label="TVA" value="20 %" mono />
          </Card>
        </div>

        <Card className="px-6 py-[22px]">
          <Field label="E-mail support" value={brand.contact.email} />
          <div className="mt-[18px]">
            <Field label="Téléphone" value={brand.contact.phone} />
          </div>
          <div className="mt-[18px]">
            <Field label="Livraison" value="Assurée et offerte" />
          </div>
        </Card>

        <Card className="px-6 py-[22px]">
          <Field
            label="Adresse"
            value={`${brand.contact.address.street}, ${brand.contact.address.zip} ${brand.contact.address.city}`}
          />
        </Card>

        <p className="text-[12px]" style={{ color: "rgba(20,21,26,0.42)" }}>
          Ces réglages viennent de la configuration de la boutique
          (<code>src/stores/{store.id}/config.ts</code>), modifiable par commit puis
          redéploiement. L&apos;édition en ligne (table de réglages) est prévue au P1.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-[12.5px] font-medium mb-2"
        style={{ color: "rgba(20,21,26,0.6)" }}
      >
        {label}
      </label>
      <input
        readOnly
        value={value}
        className="w-full text-[14px] px-[13px] py-[11px]"
        style={{
          ...inputStyle,
          fontFamily: mono ? "var(--font-geist-mono), monospace" : undefined,
        }}
      />
    </div>
  );
}
