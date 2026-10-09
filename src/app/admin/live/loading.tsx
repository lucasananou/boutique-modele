import { PageTitle } from "@/components/admin/ui";

export default function LiveLoading() {
  return (
    <div>
      <PageTitle
        title="Live Commerce"
        subtitle="Chargement des données en temps réel…"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid rgba(20,21,26,0.08)",
              borderRadius: 15,
              height: 90,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(20,21,26,0.08)",
          borderRadius: 15,
          height: 500,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}
