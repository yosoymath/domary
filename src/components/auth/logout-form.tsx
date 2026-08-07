"use client";

import { useFormStatus } from "react-dom";
import { logout } from "@/actions/auth";

type LogoutFormProps = {
  variant?: "account-menu" | "admin-sidebar";
};

function Spinner() {
  return (
    <svg aria-hidden="true" className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4m5-4 3-3-3-3m3 3H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function LogoutButton({ variant }: Required<LogoutFormProps>) {
  const { pending } = useFormStatus();
  const accountMenuClasses = "w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50";
  const adminSidebarClasses = "mt-3 w-full justify-center rounded-xl border border-white/10 bg-black/15 px-4 py-2.5 text-center text-xs font-semibold text-white/50 hover:border-red-400/30 hover:bg-red-400/[0.06] hover:text-red-300";

  return (
    <button
      aria-disabled={pending}
      className={`focus-ring inline-flex min-h-11 items-center gap-2 disabled:cursor-wait disabled:opacity-75 ${variant === "account-menu" ? accountMenuClasses : adminSidebarClasses}`}
      disabled={pending}
      type="submit"
    >
      {pending ? <Spinner /> : <LogoutIcon />}
      <span>{pending ? "Saindo com segurança..." : "Sair da conta"}</span>
    </button>
  );
}

export function LogoutForm({ variant = "account-menu" }: LogoutFormProps) {
  function handleSubmit() {
    window.dispatchEvent(new Event("domary:navigation-start"));
  }

  return (
    <form action={logout} className={variant === "account-menu" ? "border-t border-black/8 p-2" : undefined} onSubmit={handleSubmit}>
      <LogoutButton variant={variant} />
    </form>
  );
}
