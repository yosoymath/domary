"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/actions/account";
import { AccountFieldError, AccountFormAlert, accountInputClassName, accountSelectClassName } from "@/components/account/account-form-controls";
import { BirthDatePicker } from "@/components/account/birth-date-picker";
import { MaskedInput } from "@/components/account/masked-input";
import { RequiredMark } from "@/components/ui/required-mark";
import { formatCpf, formatPhone } from "@/lib/masks";

const initialState: ProfileActionState = {};

type ProfileFormProps = {
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birthDate: string;
  gender: string | null;
  today: string;
};

export function ProfileForm({ name, email, phone, cpf, birthDate, gender, today }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <AccountFormAlert message={state.message} status={state.status} trigger={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-normal" htmlFor="profile-name">Nome completo<RequiredMark /></label>
          <input aria-describedby={state.fieldErrors?.name ? "profile-name-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.name)} autoComplete="name" className={accountInputClassName} defaultValue={name} id="profile-name" maxLength={80} name="name" required />
          <AccountFieldError id="profile-name-error" messages={state.fieldErrors?.name} />
        </div>

        <div>
          <label className="text-sm font-normal" htmlFor="profile-email">E-mail<RequiredMark /></label>
          <input aria-describedby={state.fieldErrors?.email ? "profile-email-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.email)} autoCapitalize="none" autoComplete="email" className={accountInputClassName} defaultValue={email} id="profile-email" maxLength={254} name="email" required spellCheck={false} type="email" />
          <AccountFieldError id="profile-email-error" messages={state.fieldErrors?.email} />
        </div>

        <div>
          <label className="text-sm font-normal" htmlFor="profile-phone">Telefone</label>
          <MaskedInput aria-describedby={state.fieldErrors?.phone ? "profile-phone-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.phone)} autoComplete="tel" className={accountInputClassName} defaultValue={phone} id="profile-phone" inputMode="tel" mask={formatPhone} maxLength={15} name="phone" placeholder="(11) 99999-9999" />
          <AccountFieldError id="profile-phone-error" messages={state.fieldErrors?.phone} />
        </div>

        <div>
          <label className="text-sm font-normal" htmlFor="profile-cpf">CPF</label>
          <MaskedInput aria-describedby={state.fieldErrors?.cpf ? "profile-cpf-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.cpf)} autoComplete="off" className={accountInputClassName} defaultValue={cpf} id="profile-cpf" inputMode="numeric" mask={formatCpf} maxLength={14} name="cpf" placeholder="000.000.000-00" />
          <AccountFieldError id="profile-cpf-error" messages={state.fieldErrors?.cpf} />
        </div>

        <div>
          <label className="text-sm font-normal" htmlFor="profile-birth-date">Data de nascimento</label>
          <BirthDatePicker defaultValue={birthDate} describedBy={state.fieldErrors?.birthDate ? "profile-birth-date-error" : undefined} inputClassName={accountInputClassName} invalid={Boolean(state.fieldErrors?.birthDate)} today={today} />
          <AccountFieldError id="profile-birth-date-error" messages={state.fieldErrors?.birthDate} />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-normal" htmlFor="profile-gender">Gênero <span className="text-xs text-black/40">(opcional)</span></label>
          <select aria-describedby={state.fieldErrors?.gender ? "profile-gender-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.gender)} className={accountSelectClassName} defaultValue={gender ?? ""} id="profile-gender" name="gender">
            <option value="">Prefiro não informar agora</option>
            <option value="FEMALE">Feminino</option>
            <option value="MALE">Masculino</option>
            <option value="NON_BINARY">Não binário</option>
            <option value="OTHER">Outro</option>
            <option value="PREFER_NOT_TO_SAY">Prefiro não dizer</option>
          </select>
          <AccountFieldError id="profile-gender-error" messages={state.fieldErrors?.gender} />
        </div>
      </div>

      <button className="focus-ring min-h-13 rounded-full bg-domary-yellow px-7 text-sm font-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
