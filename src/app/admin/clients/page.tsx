import { getCustomers, formatSince } from "@/lib/adminData";
import { PageTitle } from "@/components/admin/ui";
import { CustomerTable } from "@/components/admin/CustomerTable";

export const metadata = { title: "Clients" };

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageTitle
        title="Clients"
        subtitle={`${customers.length} client${customers.length > 1 ? "s" : ""} (comptes et commandes sans compte) · total dépensé = commandes payées, hors remboursements`}
      />
      {customers.length === 0 ? (
        <div
          className="text-center py-16 text-[13.5px] rounded-[15px]"
          style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.08)", color: "rgba(20,21,26,0.5)" }}
        >
          Aucune cliente pour l&apos;instant.
        </div>
      ) : (
        <CustomerTable
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            orders: c.orders,
            spent: c.spent,
            hasAccount: c.hasAccount,
            since: formatSince(c.since),
          }))}
        />
      )}
    </div>
  );
}
