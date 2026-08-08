"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword, type PasswordActionState } from "@/actions/account";
import { AccountFieldError, AccountFormAlert, accountInputClassName } from "@/components/account/account-form-controls";
import { RequiredMark } from "@/components/ui/required-mark";
import { PASSWORD_LETTER_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_NUMBER_PATTERN } from "@/lib/password-policy";

const initialState: PasswordActionState = {};

function PasswordRequirement({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 text-xs font-semibold transition-colors ${checked ? "text-emerald-700" : "text-black/40"}`}>
      <span
        aria-hidden="true"
        className={`grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-black transition-colors ${checked ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-black/15 bg-white text-transparent"}`}
      >
        ✓
      </span>
      <span>{children}</span>
      <span className="sr-only">{checked ? "atendido" : "pendente"}</span>
    </li>
  );
}

export function SecurityForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const passwordRequirements = [
    { label: `${PASSWORD_MIN_LENGTH} ou mais caracteres`, checked: newPassword.length >= PASSWORD_MIN_LENGTH },
    { label: "Pelo menos uma letra", checked: PASSWORD_LETTER_PATTERN.test(newPassword) },
    { label: "Pelo menos um número", checked: PASSWORD_NUMBER_PATTERN.test(newPassword) },
    { label: "As duas senhas coincidem", checked: confirmPassword.length > 0 && newPassword === confirmPassword },
  ];

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      <AccountFormAlert message={state.message} status={state.status} trigger={state} />
      <div>
        <label className="text-sm font-normal" htmlFor="current-password">Senha atual<RequiredMark /></label>
        <input aria-invalid={Boolean(state.fieldErrors?.currentPassword)} autoComplete="current-password" className={accountInputClassName} id="current-password" name="currentPassword" required type="password" />
        <AccountFieldError id="current-password-error" messages={state.fieldErrors?.currentPassword} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-normal" htmlFor="new-password">Nova senha<RequiredMark /></label>
          <input aria-describedby="password-requirements new-password-error" aria-invalid={Boolean(state.fieldErrors?.newPassword)} autoComplete="new-password" className={accountInputClassName} id="new-password" minLength={PASSWORD_MIN_LENGTH} name="newPassword" onChange={(event) => setNewPassword(event.currentTarget.value)} required type="password" />
          <AccountFieldError id="new-password-error" messages={state.fieldErrors?.newPassword} />
        </div>
        <div>
          <label className="text-sm font-normal" htmlFor="confirm-password">Confirmar nova senha<RequiredMark /></label>
          <input aria-describedby="password-requirements confirm-password-error" aria-invalid={Boolean(state.fieldErrors?.confirmPassword)} autoComplete="new-password" className={accountInputClassName} id="confirm-password" minLength={PASSWORD_MIN_LENGTH} name="confirmPassword" onChange={(event) => setConfirmPassword(event.currentTarget.value)} required type="password" />
          <AccountFieldError id="confirm-password-error" messages={state.fieldErrors?.confirmPassword} />
        </div>
      </div>
      <div className="rounded-2xl border border-black/8 bg-black/[0.025] p-4" id="password-requirements">
        <p className="text-xs font-black text-black/65">Sua nova senha precisa ter:</p>
        <ul aria-live="polite" className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {passwordRequirements.map((requirement) => (
            <PasswordRequirement checked={requirement.checked} key={requirement.label}>{requirement.label}</PasswordRequirement>
          ))}
        </ul>
      </div>
      <button className="focus-ring min-h-13 rounded-full bg-domary-black px-7 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">{pending ? "Salvando..." : "Alterar senha"}</button>
    </form>
  );
}
