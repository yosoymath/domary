type FieldErrorProps = {
  id: string;
  messages?: string[];
};

export function FieldError({ id, messages }: FieldErrorProps) {
  if (!messages?.length) return null;

  return (
    <p className="mt-2 text-xs font-semibold text-red-600" id={id}>
      {messages[0]}
    </p>
  );
}

export function FormAlert({ message, trigger }: { message?: string; trigger?: unknown }) {
  return <ToastFeedback message={message ?? ""} trigger={trigger} variant="error" />;
}

export const inputClassName =
  "focus-ring mt-2 min-h-14 w-full rounded-2xl border border-black/15 bg-white px-4 text-sm font-normal text-black outline-none transition placeholder:text-black/30 hover:border-black/30 focus:border-domary-yellow";
import { ToastFeedback } from "@/components/ui/toast";
