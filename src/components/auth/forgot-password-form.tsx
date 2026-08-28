"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { requestPasswordReset, type ForgotPasswordActionState } from "@/actions/auth";
import { RequiredMark } from "@/components/ui/required-mark";
import { ToastFeedback } from "@/components/ui/toast";
import { FieldError, inputClassName } from "./form-controls";

const initialState: ForgotPasswordActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      <ToastFeedback message={state.message ?? ""} trigger={state} variant={state.status === "success" ? "success" : "error"} />

      <div>
        <label className="text-sm font-normal" htmlFor="forgot-password-email">E-mail<RequiredMark /></label>
        <input
          aria-describedby={state.fieldErrors?.email ? "forgot-password-email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoCapitalize="none"
          autoComplete="email"
          className={inputClassName}
          id="forgot-password-email"
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          spellCheck={false}
          type="email"
        />
        <FieldError id="forgot-password-email-error" messages={state.fieldErrors?.email} />
      </div>

      <button className="focus-ring min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Enviando link..." : "Enviar link de recuperação"}
      </button>

      <p className="text-center text-sm text-black/45">
        Lembrou sua senha?{" "}
        <Link className="focus-ring font-bold text-domary-yellow hover:underline" href="/login">Voltar para o login</Link>
      </p>
    </form>
  );
}
