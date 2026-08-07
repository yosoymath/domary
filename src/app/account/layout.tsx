import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Cada página filha faz sua própria verificação segura junto ao DAL.
  // O layout consulta somente para personalizar o shell sem perder a rota
  // original no callbackUrl de visitantes ainda não autenticados.
  const user = await getCurrentUser();
  const firstName = user?.name.split(/\s+/)[0] ?? "cliente";

  return (
    <section className="min-h-[70vh] bg-domary-cream px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-black tracking-[0.2em] text-black/40 uppercase">Área do cliente</p>
          <h1 className="mt-2 [overflow-wrap:anywhere] text-3xl font-black tracking-[-0.05em] uppercase sm:text-5xl">Olá, {firstName}</h1>
          <p className="mt-3 text-sm text-black/50">Gerencie seus dados, pedidos e produtos favoritos.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside><AccountNav /></aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
