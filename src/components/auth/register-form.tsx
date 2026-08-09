"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register, type RegisterActionState } from "@/actions/auth";
import { RequiredMark } from "@/components/ui/required-mark";
import { PASSWORD_LETTER_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_NUMBER_PATTERN } from "@/lib/password-policy";
import { FieldError, FormAlert, inputClassName } from "./form-controls";

const initialState: RegisterActionState = {};

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      {!visible ? <path d="m4 4 16 16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /> : null}
    </svg>
  );
}

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

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const passwordRequirements = [
    { label: `${PASSWORD_MIN_LENGTH} ou mais caracteres`, checked: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Pelo menos uma letra", checked: PASSWORD_LETTER_PATTERN.test(password) },
    { label: "Pelo menos um número", checked: PASSWORD_NUMBER_PATTERN.test(password) },
    { label: "As duas senhas coincidem", checked: confirmPassword.length > 0 && password === confirmPassword },
  ];

  return (
    <form action={formAction} className="space-y-5">
      <FormAlert message={state.message} trigger={state} />

      <div>
        <label className="text-sm font-normal" htmlFor="register-name">Nome<RequiredMark /></label>
        <input
          aria-describedby={state.fieldErrors?.name ? "register-name-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          autoComplete="name"
          className={inputClassName}
          id="register-name"
          maxLength={80}
          name="name"
          placeholder="Como podemos chamar você?"
          required
          type="text"
        />
        <FieldError id="register-name-error" messages={state.fieldErrors?.name} />
      </div>

      <div>
        <label className="text-sm font-normal" htmlFor="register-email">E-mail<RequiredMark /></label>
        <input
          aria-describedby={state.fieldErrors?.email ? "register-email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoCapitalize="none"
          autoComplete="email"
          className={inputClassName}
          id="register-email"
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          spellCheck={false}
          type="email"
        />
        <FieldError id="register-email-error" messages={state.fieldErrors?.email} />
      </div>

      <div>
        <label className="text-sm font-normal" htmlFor="register-password">Senha<RequiredMark /></label>
        <div className="relative">
          <input
            aria-describedby="register-password-error register-password-requirements"
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="new-password"
            className={`${inputClassName} pr-14`}
            id="register-password"
            minLength={PASSWORD_MIN_LENGTH}
            name="password"
            onChange={(event) => setPassword(event.currentTarget.value)}
            placeholder="Crie uma senha segura"
            required
            type={passwordVisible ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={passwordVisible ? "Ocultar senha" : "Visualizar senha"}
            aria-pressed={passwordVisible}
            className="focus-ring absolute right-2 top-1/2 grid size-10 -translate-y-[42%] place-items-center rounded-full text-black/45 hover:bg-black/[0.055] hover:text-black"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            <EyeIcon visible={passwordVisible} />
          </button>
        </div>
        <FieldError id="register-password-error" messages={state.fieldErrors?.password} />
      </div>

      <div>
        <label className="text-sm font-normal" htmlFor="register-confirm-password">Confirmar senha<RequiredMark /></label>
        <div className="relative">
          <input
            aria-describedby="register-confirm-password-error register-password-requirements"
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            autoComplete="new-password"
            className={`${inputClassName} pr-14`}
            id="register-confirm-password"
            minLength={PASSWORD_MIN_LENGTH}
            name="confirmPassword"
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            placeholder="Digite a senha novamente"
            required
            type={confirmationVisible ? "text" : "password"}
            value={confirmPassword}
          />
          <button
            aria-label={confirmationVisible ? "Ocultar confirmação da senha" : "Visualizar confirmação da senha"}
            aria-pressed={confirmationVisible}
            className="focus-ring absolute right-2 top-1/2 grid size-10 -translate-y-[42%] place-items-center rounded-full text-black/45 hover:bg-black/[0.055] hover:text-black"
            onClick={() => setConfirmationVisible((visible) => !visible)}
            type="button"
          >
            <EyeIcon visible={confirmationVisible} />
          </button>
        </div>
        <FieldError id="register-confirm-password-error" messages={state.fieldErrors?.confirmPassword} />
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-4" id="register-password-requirements">
        <p className="text-xs font-black text-black/65">Sua senha precisa ter:</p>
        <ul aria-live="polite" className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {passwordRequirements.map((requirement) => (
            <PasswordRequirement checked={requirement.checked} key={requirement.label}>{requirement.label}</PasswordRequirement>
          ))}
        </ul>
      </div>

      <button className="focus-ring min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Criando sua conta..." : "Criar minha conta"}
      </button>

      <p className="text-center text-sm text-black/45">
        Já tem uma conta?{" "}
        <Link className="focus-ring font-bold text-domary-yellow hover:underline" href="/login">Entrar</Link>
      </p>
    </form>
  );
}
