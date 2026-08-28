"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordActionState } from "@/actions/auth";
import { RequiredMark } from "@/components/ui/required-mark";
import { PASSWORD_LETTER_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_NUMBER_PATTERN } from "@/lib/password-policy";
import { FieldError, FormAlert, inputClassName } from "./form-controls";

const initialState: ResetPasswordActionState = {};

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

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordRequirements = [
    { label: `${PASSWORD_MIN_LENGTH} ou mais caracteres`, checked: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Pelo menos uma letra", checked: PASSWORD_LETTER_PATTERN.test(password) },
    { label: "Pelo menos um número", checked: PASSWORD_NUMBER_PATTERN.test(password) },
    { label: "As duas senhas coincidem", checked: confirmPassword.length > 0 && password === confirmPassword },
  ];

  return (
    <form action={formAction} className="space-y-5">
      <input name="token" type="hidden" value={token} />
      <FormAlert message={state.message} trigger={state} />

      <div>
        <label className="text-sm font-normal" htmlFor="reset-password">Nova senha<RequiredMark /></label>
        <input
          aria-describedby="reset-password-error reset-password-requirements"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="new-password"
          className={inputClassName}
          id="reset-password"
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="Crie uma nova senha segura"
          required
          type="password"
          value={password}
        />
        <FieldError id="reset-password-error" messages={state.fieldErrors?.password} />
      </div>

      <div>
        <label className="text-sm font-normal" htmlFor="reset-confirm-password">Confirmar nova senha<RequiredMark /></label>
        <input
          aria-describedby="reset-confirm-password-error reset-password-requirements"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          autoComplete="new-password"
          className={inputClassName}
          id="reset-confirm-password"
          minLength={PASSWORD_MIN_LENGTH}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          placeholder="Digite a nova senha novamente"
          required
          type="password"
          value={confirmPassword}
        />
        <FieldError id="reset-confirm-password-error" messages={state.fieldErrors?.confirmPassword} />
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-4" id="reset-password-requirements">
        <p className="text-xs font-black text-black/65">Sua nova senha precisa ter:</p>
        <ul aria-live="polite" className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {passwordRequirements.map((requirement) => (
            <PasswordRequirement checked={requirement.checked} key={requirement.label}>{requirement.label}</PasswordRequirement>
          ))}
        </ul>
      </div>

      <button className="focus-ring min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Salvando nova senha..." : "Criar nova senha"}
      </button>

      <p className="text-center text-sm text-black/45">
        <Link className="focus-ring font-bold text-domary-yellow hover:underline" href="/login">Voltar para o login</Link>
      </p>
    </form>
  );
}
