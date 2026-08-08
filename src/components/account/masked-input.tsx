"use client";

import type { FormEvent, InputHTMLAttributes } from "react";

type MaskedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onInput"> & {
  defaultValue?: string | null;
  mask: (value: string) => string;
  onMaskedValueChange?: (value: string) => void;
};

export function MaskedInput({ defaultValue, mask, onMaskedValueChange, ...props }: MaskedInputProps) {
  function handleInput(event: FormEvent<HTMLInputElement>) {
    const maskedValue = mask(event.currentTarget.value);
    event.currentTarget.value = maskedValue;
    onMaskedValueChange?.(maskedValue);
  }

  return <input {...props} defaultValue={mask(defaultValue ?? "")} onInput={handleInput} />;
}
