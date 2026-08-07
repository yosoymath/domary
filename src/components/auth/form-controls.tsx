type FieldErrorProps = {
  id: string;
  messages?: string[];
};

export function FieldError({ id, messages }: FieldErrorProps) {
  if (!messages?.length) return null;

  return (
    <p className="mt-2 text-xs font-semibold text-red-400" id={id}>
      {messages[0]}
    </p>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300" role="alert">
      {message}
    </div>
  );
}

export const inputClassName =
  "focus-ring mt-2 min-h-14 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/25 hover:border-white/25 focus:border-domary-yellow";
