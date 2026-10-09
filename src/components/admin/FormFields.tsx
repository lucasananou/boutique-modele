import type { ReactNode } from "react";

/* Champs de formulaire de l'admin (formulaires « server action », sans état). */

export const fieldStyle: React.CSSProperties = {
  background: "#FBFAF8",
  border: "1px solid rgba(20,21,26,0.1)",
  borderRadius: 10,
};

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block mb-[16px]">
      <span className="block text-[12.5px] font-medium mb-1.5" style={{ color: "rgba(20,21,26,0.6)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11.5px] mt-1" style={{ color: "rgba(20,21,26,0.45)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  const { mono, ...rest } = props;
  return (
    <input
      {...rest}
      className="w-full text-[14px] px-[13px] py-[10px]"
      style={{ ...fieldStyle, fontFamily: mono ? "var(--font-geist-mono), monospace" : undefined }}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean },
) {
  const { mono, ...rest } = props;
  return (
    <textarea
      {...rest}
      className="w-full text-[13.5px] px-[13px] py-[10px] leading-[1.55]"
      style={{ ...fieldStyle, fontFamily: mono ? "var(--font-geist-mono), monospace" : undefined }}
    />
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div
      className="text-[13px] font-medium px-4 py-3 rounded-[10px] mb-4"
      style={
        error
          ? { background: "rgba(196,48,72,0.09)", color: "#A3243B" }
          : { background: "rgba(31,138,91,0.11)", color: "#1F7A52" }
      }
    >
      {error ?? "Enregistré"}
    </div>
  );
}

export function SubmitButton({ children, danger }: { children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="submit"
      className="text-[13px] font-medium px-4 py-2.5 rounded-[10px] cursor-pointer"
      style={
        danger
          ? { background: "rgba(196,48,72,0.09)", color: "#A3243B" }
          : { background: "#14151A", color: "#FBFAF8" }
      }
    >
      {children}
    </button>
  );
}
