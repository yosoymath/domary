type FieldErrorProps = {
  id: string;
  messages?: string[];
};

export const accountInputClassName = "focus-ring mt-2 min-h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-normal outline-none transition placeholder:text-black/30 hover:border-black/20 focus:border-domary-yellow";
export const accountSelectClassName = `${accountInputClassName} appearance-none`;

export function AccountFieldError({ id, messages }: FieldErrorProps) {
  if (!messages?.length) return null;
  return <p className="mt-2 text-xs font-semibold text-red-600" id={id}>{messages[0]}</p>;
}

export function AccountFormAlert({ message, status, trigger }: { message?: string; status?: "success" | "error"; trigger?: unknown }) {
  return <ToastFeedback message={message ?? ""} trigger={trigger} variant={status === "success" ? "success" : "error"} />;
}
import { ToastFeedback } from "@/components/ui/toast";
