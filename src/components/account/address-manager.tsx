"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteAddress, saveAddress, type AddressActionState } from "@/actions/account";
import { AccountFieldError, AccountFormAlert, accountInputClassName, accountSelectClassName } from "@/components/account/account-form-controls";
import { MaskedInput } from "@/components/account/masked-input";
import { RequiredMark } from "@/components/ui/required-mark";
import { useToast } from "@/components/ui/toast";
import { formatPostalCode } from "@/lib/masks";

export type CustomerAddressData = {
  id: string;
  label: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  isPrimary: boolean;
};

const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const initialState: AddressActionState = {};

type PostalCodeResponse = {
  street: string;
  district: string;
  city: string;
  state: string;
};

function AddressForm({ address, onCancel, onSaved }: { address?: CustomerAddressData; onCancel?: () => void; onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(saveAddress, initialState);
  const [postalCodeStatus, setPostalCodeStatus] = useState<"idle" | "loading" | "success">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const handledStateRef = useRef<AddressActionState | undefined>(undefined);
  const lastPostalCodeRef = useRef("");
  const postalCodeAbortRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();

  function setAddressField(name: keyof PostalCodeResponse, value: string) {
    const field = formRef.current?.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      field.value = value;
    }
  }

  async function lookupPostalCode(maskedPostalCode: string) {
    const postalCode = maskedPostalCode.replace(/\D/g, "");

    if (postalCode.length !== 8) {
      postalCodeAbortRef.current?.abort();
      postalCodeAbortRef.current = null;
      lastPostalCodeRef.current = "";
      setPostalCodeStatus("idle");
      return;
    }

    if (postalCode === lastPostalCodeRef.current) return;

    postalCodeAbortRef.current?.abort();
    const controller = new AbortController();
    postalCodeAbortRef.current = controller;
    lastPostalCodeRef.current = postalCode;
    setPostalCodeStatus("loading");

    try {
      const response = await fetch(`/api/postal-code/${postalCode}`, {
        signal: controller.signal,
      });
      const payload = await response.json() as PostalCodeResponse & { message?: string };

      if (!response.ok) {
        lastPostalCodeRef.current = "";
        showToast({
          message: payload.message ?? "Não foi possível consultar o CEP agora.",
          title: response.status === 404 ? "CEP não encontrado" : "Falha ao consultar CEP",
          variant: response.status === 404 ? "warning" : "error",
        });
        setPostalCodeStatus("idle");
        return;
      }

      setAddressField("street", payload.street);
      setAddressField("district", payload.district);
      setAddressField("city", payload.city);
      setAddressField("state", payload.state);
      setPostalCodeStatus("success");
      showToast({
        message: "Rua, bairro, cidade e estado foram preenchidos.",
        title: "Endereço localizado",
        variant: "success",
        duration: 3500,
      });

      const numberField = formRef.current?.elements.namedItem("number");
      if (numberField instanceof HTMLInputElement) numberField.focus();
    } catch {
      if (controller.signal.aborted) return;
      lastPostalCodeRef.current = "";
      setPostalCodeStatus("idle");
      showToast({
        message: "Verifique sua conexão e tente preencher o CEP novamente.",
        title: "Falha ao consultar CEP",
        variant: "error",
      });
    } finally {
      if (postalCodeAbortRef.current === controller) {
        postalCodeAbortRef.current = null;
        setPostalCodeStatus((current) => current === "loading" ? "idle" : current);
      }
    }
  }

  useEffect(() => {
    if (state.status === "success" && handledStateRef.current !== state) {
      handledStateRef.current = state;
      formRef.current?.reset();
      lastPostalCodeRef.current = "";
      setPostalCodeStatus("idle");
      onSaved();
    }
  }, [state, onSaved]);

  useEffect(() => () => postalCodeAbortRef.current?.abort(), []);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl bg-black/[0.025] p-4 sm:p-6" ref={formRef}>
      <input name="addressId" type="hidden" value={address?.id ?? ""} />
      <div>
        <p className="text-sm font-black">{address ? `Editar ${address.label}` : "Adicionar endereço"}</p>
        <p className="mt-1 text-xs text-black/45">Os campos marcados são necessários para identificar o local de entrega.</p>
      </div>
      <AccountFormAlert message={state.status === "error" ? state.message : undefined} status="error" trigger={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-normal" htmlFor={`address-label-${address?.id ?? "new"}`}>Apelido<RequiredMark /></label>
          <input aria-invalid={Boolean(state.fieldErrors?.label)} autoComplete="off" className={accountInputClassName} defaultValue={address?.label ?? ""} id={`address-label-${address?.id ?? "new"}`} maxLength={30} name="label" placeholder="Casa ou Trabalho" required />
          <AccountFieldError id={`address-label-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.label} />
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label className="text-sm font-normal" htmlFor={`address-postal-code-${address?.id ?? "new"}`}>CEP<RequiredMark /></label>
            <a
              aria-label="Não sabe seu CEP? Encontre no site dos Correios (abre em uma nova aba)"
              className="focus-ring rounded text-xs font-semibold text-black/55 underline decoration-domary-yellow decoration-2 underline-offset-3 hover:text-black"
              href="https://buscacepinter.correios.com.br/app/endereco/index.php"
              rel="noopener noreferrer"
              target="_blank"
            >
              Não sabe seu CEP? <span className="font-black">Encontre aqui ↗</span>
            </a>
          </div>
          <MaskedInput aria-busy={postalCodeStatus === "loading"} aria-invalid={Boolean(state.fieldErrors?.postalCode)} autoComplete="postal-code" className={accountInputClassName} defaultValue={address?.postalCode} id={`address-postal-code-${address?.id ?? "new"}`} inputMode="numeric" mask={formatPostalCode} maxLength={9} name="postalCode" onMaskedValueChange={(value) => void lookupPostalCode(value)} placeholder="00000-000" required />
          <AccountFieldError id={`address-postal-code-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.postalCode} />
          <p aria-live="polite" className="mt-1.5 min-h-4 text-xs text-black/45">
            {postalCodeStatus === "loading" ? "Buscando endereço..." : postalCodeStatus === "success" ? "Endereço preenchido. Informe o número e o complemento." : ""}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-normal" htmlFor={`address-street-${address?.id ?? "new"}`}>Rua<RequiredMark /></label>
          <input aria-invalid={Boolean(state.fieldErrors?.street)} autoComplete="address-line1" className={accountInputClassName} defaultValue={address?.street ?? ""} id={`address-street-${address?.id ?? "new"}`} maxLength={120} name="street" required />
          <AccountFieldError id={`address-street-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.street} />
        </div>
        <div>
          <label className="text-sm font-normal" htmlFor={`address-number-${address?.id ?? "new"}`}>Número<RequiredMark /></label>
          <input aria-invalid={Boolean(state.fieldErrors?.number)} className={accountInputClassName} defaultValue={address?.number ?? ""} id={`address-number-${address?.id ?? "new"}`} maxLength={20} name="number" required />
          <AccountFieldError id={`address-number-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.number} />
        </div>
        <div>
          <label className="text-sm font-normal" htmlFor={`address-complement-${address?.id ?? "new"}`}>Complemento</label>
          <input aria-invalid={Boolean(state.fieldErrors?.complement)} autoComplete="address-line2" className={accountInputClassName} defaultValue={address?.complement ?? ""} id={`address-complement-${address?.id ?? "new"}`} maxLength={80} name="complement" placeholder="Apto, bloco, referência" />
          <AccountFieldError id={`address-complement-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.complement} />
        </div>
        <div>
          <label className="text-sm font-normal" htmlFor={`address-district-${address?.id ?? "new"}`}>Bairro<RequiredMark /></label>
          <input aria-invalid={Boolean(state.fieldErrors?.district)} className={accountInputClassName} defaultValue={address?.district ?? ""} id={`address-district-${address?.id ?? "new"}`} maxLength={80} name="district" required />
          <AccountFieldError id={`address-district-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.district} />
        </div>
        <div>
          <label className="text-sm font-normal" htmlFor={`address-city-${address?.id ?? "new"}`}>Cidade<RequiredMark /></label>
          <input aria-invalid={Boolean(state.fieldErrors?.city)} autoComplete="address-level2" className={accountInputClassName} defaultValue={address?.city ?? ""} id={`address-city-${address?.id ?? "new"}`} maxLength={80} name="city" required />
          <AccountFieldError id={`address-city-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.city} />
        </div>
        <div>
          <label className="text-sm font-normal" htmlFor={`address-state-${address?.id ?? "new"}`}>Estado<RequiredMark /></label>
          <select aria-invalid={Boolean(state.fieldErrors?.state)} autoComplete="address-level1" className={accountSelectClassName} defaultValue={address?.state ?? ""} id={`address-state-${address?.id ?? "new"}`} name="state" required>
            <option disabled value="">Selecione</option>
            {states.map((stateCode) => <option key={stateCode} value={stateCode}>{stateCode}</option>)}
          </select>
          <AccountFieldError id={`address-state-error-${address?.id ?? "new"}`} messages={state.fieldErrors?.state} />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm">
        <input className="mt-0.5 size-4 accent-domary-yellow" defaultChecked={address?.isPrimary ?? false} name="isPrimary" type="checkbox" />
        <span><strong className="block font-black">Endereço principal</strong><span className="mt-0.5 block text-xs text-black/45">Será a primeira opção sugerida nas entregas.</span></span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="focus-ring min-h-13 rounded-full bg-domary-yellow px-7 text-sm font-black transition hover:-translate-y-0.5 hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending || postalCodeStatus === "loading"} type="submit">{pending ? "Salvando..." : postalCodeStatus === "loading" ? "Buscando CEP..." : address ? "Salvar endereço" : "Adicionar endereço"}</button>
        {onCancel ? <button className="focus-ring min-h-13 rounded-full border border-black/10 px-7 text-sm font-black transition hover:border-black/25" onClick={onCancel} type="button">Cancelar</button> : null}
      </div>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: CustomerAddressData[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<{ message: string }>();
  const [deleteState, deleteAction, deleting] = useActionState(deleteAddress, initialState);
  const editingAddress = addresses.find((address) => address.id === editingId);

  return (
    <div className="space-y-5">
      <AccountFormAlert message={saveNotice?.message} status="success" trigger={saveNotice} />
      <AccountFormAlert message={deleteState.message} status={deleteState.status} trigger={deleteState} />
      {addresses.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <article className={`rounded-3xl border p-5 ${address.isPrimary ? "border-domary-yellow bg-domary-yellow/[0.06]" : "border-black/8 bg-white"}`} key={address.id}>
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-black">{address.label}</h3>{address.isPrimary ? <span className="mt-2 inline-flex rounded-full bg-domary-yellow px-2.5 py-1 text-[10px] font-black tracking-wide text-domary-black uppercase">Principal</span> : null}</div>
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.04]">⌂</span>
              </div>
              <address className="mt-4 text-sm leading-6 not-italic text-black/55">
                {address.street}, {address.number}{address.complement ? ` · ${address.complement}` : ""}<br />
                {address.district} · {address.city}/{address.state}<br />
                CEP {formatPostalCode(address.postalCode)}
              </address>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-black/8 pt-4">
                <button className="focus-ring rounded-full border border-black/10 px-4 py-2 text-xs font-black hover:border-domary-yellow" onClick={() => { setSaveNotice(undefined); setEditingId(address.id); }} type="button">Editar</button>
                <form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Remover o endereço ${address.label}?`)) event.preventDefault(); }}>
                  <input name="addressId" type="hidden" value={address.id} />
                  <button className="focus-ring rounded-full px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50" disabled={deleting} type="submit">Remover</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-black/15 px-5 py-7 text-center"><p className="font-black">Nenhum endereço cadastrado</p><p className="mt-1 text-sm text-black/45">Adicione um endereço para agilizar suas próximas compras.</p></div>
      )}

      <AddressForm
        address={editingAddress}
        key={editingAddress?.id ?? "new"}
        onCancel={editingAddress ? () => setEditingId(null) : undefined}
        onSaved={() => {
          setSaveNotice({ message: editingAddress ? "Endereço atualizado com sucesso." : "Endereço adicionado com sucesso." });
          setEditingId(null);
        }}
      />
    </div>
  );
}
