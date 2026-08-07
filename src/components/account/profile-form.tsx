"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/actions/account";
import { RequiredMark } from "@/components/ui/required-mark";

const initialState: ProfileActionState = {};
const inputClassName = "focus-ring mt-2 min-h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-normal outline-none transition placeholder:text-black/30 hover:border-black/20 focus:border-domary-yellow";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${state.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`} role={state.status === "success" ? "status" : "alert"}>
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-normal" htmlFor="profile-name">Nome completo<RequiredMark /></label>
          <input aria-describedby={state.fieldErrors?.name ? "profile-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.name)} autoComplete="name" className={inputClassName} defaultValue={name} id="profile-name" maxLength={80} name="name" required />
          {state.fieldErrors?.name ? <p className="mt-2 text-xs font-semibold text-red-600" id="profile-name-error">{state.fieldErrors.name[0]}</p> : null}
        </div>

        <div>
          <label className="text-sm font-normal" htmlFor="profile-email">E-mail</label>
          <input className={`${inputClassName} cursor-not-allowed bg-black/[0.03] text-black/50`} disabled id="profile-email" value={email} />
          <p className="mt-2 text-xs text-black/40">A troca de e-mail exige verificação de identidade.</p>
        </div>

        <div>
          <label className="text-sm font-normal" htmlFor="profile-phone">Telefone</label>
          <input aria-describedby={state.fieldErrors?.phone ? "profile-phone-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.phone)} autoComplete="tel" className={inputClassName} defaultValue={phone ?? ""} id="profile-phone" inputMode="tel" name="phone" placeholder="(11) 99999-9999" />
          {state.fieldErrors?.phone ? <p className="mt-2 text-xs font-semibold text-red-600" id="profile-phone-error">{state.fieldErrors.phone[0]}</p> : null}
        </div>
      </div>

      <button className="focus-ring min-h-13 rounded-full bg-domary-yellow px-7 text-sm font-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
