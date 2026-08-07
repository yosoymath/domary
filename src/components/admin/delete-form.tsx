"use client";

import { useFormStatus } from "react-dom";

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="focus-ring rounded-xl px-3 py-2 text-xs font-extrabold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-50" disabled={pending} type="submit">
      {pending ? "Excluindo..." : label}
    </button>
  );
}

export function DeleteForm({ action, itemName, label = "Excluir" }: {
  action: () => Promise<void>;
  itemName: string;
  label?: string;
}) {
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm(`Excluir "${itemName}" permanentemente?`)) event.preventDefault();
    }}>
      <DeleteButton label={label} />
    </form>
  );
}
