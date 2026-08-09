"use client";

import { useActionState, type KeyboardEvent } from "react";
import Link from "next/link";
import { login, type LoginActionState } from "@/actions/auth";
import { RequiredMark } from "@/components/ui/required-mark";
import { FieldError, FormAlert, inputClassName } from "./form-controls";

const initialState: LoginActionState = {};

export function LoginForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  function handleEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !["email", "password"].includes(target.type)) return;

    event.preventDefault();
    if (!pending) event.currentTarget.requestSubmit();
  }

  return (
    <form action={formAction} className="space-y-5" onKeyDown={handleEnterSubmit}>
      <input name="callbackUrl" type="hidden" value={callbackUrl} />
      <FormAlert message={state.message} trigger={state} />

      <div>
        <label className="text-sm font-normal" htmlFor="login-email">E-mail<RequiredMark /></label>
        <input
          aria-describedby={state.fieldErrors?.email ? "login-email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoCapitalize="none"
          autoComplete="email"
          className={inputClassName}
          id="login-email"
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          spellCheck={false}
          type="email"
        />
        <FieldError id="login-email-error" messages={state.fieldErrors?.email} />
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-normal" htmlFor="login-password">Senha<RequiredMark /></label>
          <span className="text-xs text-black/35">Esqueci minha senha</span>
        </div>
        <input
          aria-describedby={state.fieldErrors?.password ? "login-password-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="current-password"
          className={inputClassName}
          id="login-password"
          name="password"
          placeholder="Digite sua senha"
          required
          type="password"
        />
        <FieldError id="login-password-error" messages={state.fieldErrors?.password} />
      </div>

      <button className="focus-ring min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Entrando..." : "Entrar na minha conta"}
      </button>

      <p className="text-center text-sm text-black/45">
        Ainda não tem conta?{" "}
        <Link className="focus-ring font-bold text-domary-yellow hover:underline" href="/register">Cadastre-se</Link>
      </p>
    </form>
  );
}
