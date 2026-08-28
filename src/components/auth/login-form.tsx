"use client";

import { useActionState, useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { login, type LoginActionState } from "@/actions/auth";
import { RequiredMark } from "@/components/ui/required-mark";
import { FieldError, FormAlert, inputClassName } from "./form-controls";
import { PasswordVisibilityIcon } from "./password-visibility-icon";

const initialState: LoginActionState = {};

export function LoginForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (!state.message) return;
    setPassword("");
    setPasswordVisible(false);
  }, [state]);

  function handleEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !["email", "password"].includes(target.name)) return;

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
          onChange={(event) => setEmail(event.currentTarget.value)}
          placeholder="voce@exemplo.com"
          required
          spellCheck={false}
          type="email"
          value={email}
        />
        <FieldError id="login-email-error" messages={state.fieldErrors?.email} />
      </div>

      <div>
        <label className="text-sm font-normal" htmlFor="login-password">Senha<RequiredMark /></label>
        <div className="relative">
          <input
            aria-describedby={state.fieldErrors?.password ? "login-password-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="current-password"
            className={`${inputClassName} pr-14`}
            id="login-password"
            name="password"
            onChange={(event) => setPassword(event.currentTarget.value)}
            placeholder="Digite sua senha"
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
            <PasswordVisibilityIcon visible={passwordVisible} />
          </button>
        </div>
        <FieldError id="login-password-error" messages={state.fieldErrors?.password} />
      </div>

      <button className="focus-ring min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Entrando..." : "Entrar na minha conta"}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 text-sm">
        <Link className="focus-ring font-normal text-black/45 underline decoration-current decoration-1 underline-offset-4 hover:text-black" href="/forgot-password">Esqueci minha senha</Link>
        <p className="text-black/45">
          Ainda não tem conta?{" "}
          <Link className="focus-ring font-bold text-domary-yellow hover:underline" href="/register">Cadastre-se</Link>
        </p>
      </div>
    </form>
  );
}
