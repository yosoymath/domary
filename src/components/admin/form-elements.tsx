export const adminInputClassName = "focus-ring mt-2 min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm font-normal text-black placeholder:text-black/30 disabled:bg-black/[0.03]";
export const adminTextareaClassName = `${adminInputClassName} min-h-32 resize-y py-3`;
export const adminSelectClassName = `${adminInputClassName} appearance-none`;

export function AdminFieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-600">{messages[0]}</p>;
}

export function AdminFormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{message}</div>;
}
