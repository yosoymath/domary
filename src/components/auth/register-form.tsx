"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type RegisterActionState } from "@/actions/auth";
import { RequiredMark } from "@/components/ui/required-mark";
import { FieldError, FormAlert, inputClassName } from "./form-controls";

const initialState: RegisterActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <FormAlert message={state.message} />

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
        <input
          aria-describedby={state.fieldErrors?.password ? "register-password-error register-password-help" : "register-password-help"}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="new-password"
          className={inputClassName}
          id="register-password"
          minLength={8}
          name="password"
          placeholder="Crie uma senha segura"
          required
          type="password"
        />
        <p className="mt-2 text-xs text-white/35" id="register-password-help">Use 8 ou mais caracteres, com letras e números.</p>
        <FieldError id="register-password-error" messages={state.fieldErrors?.password} />
      </div>

      <button className="focus-ring min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Criando sua conta..." : "Criar minha conta"}
      </button>

      <p className="text-center text-sm text-white/45">
        Já tem uma conta?{" "}
        <Link className="focus-ring font-bold text-domary-yellow hover:underline" href="/login">Entrar</Link>
      </p>
    </form>
  );
}
