import type { Metadata } from "next";
import Link from "next/link";
import { SupportPageShell, SupportSection } from "@/components/support/support-page-shell";

export const metadata: Metadata = {
  title: "Fale conosco",
  description: "Encontre o canal certo para falar com a equipe Domary sobre pedidos, produtos, trocas e privacidade.",
};

function validSupportEmail() {
  const value = process.env.CONTACT_EMAIL?.trim() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

const topics = [
  { title: "Pedidos e entregas", text: "Consulte o andamento, os itens e os dados da sua compra na área do cliente.", href: "/account/orders", action: "Ver meus pedidos" },
  { title: "Trocas e devoluções", text: "Confira prazos, condições e o passo a passo antes de iniciar uma solicitação.", href: "/trocas", action: "Consultar política" },
  { title: "Dúvidas sobre produtos", text: "Veja o catálogo, as variações disponíveis e as informações de cada peça.", href: "/produtos", action: "Explorar produtos" },
] as const;

export default function ContactPage() {
  const supportEmail = validSupportEmail();

  return (
    <SupportPageShell
      activePath="/contato"
      description="Escolha o assunto para encontrar rapidamente as informações e o canal adequado para o seu atendimento."
      eyebrow="Atendimento"
      title="Como podemos ajudar?"
    >
      <SupportSection title="Escolha o assunto">
        <div className="grid gap-4 md:grid-cols-3">
          {topics.map((topic, index) => (
            <div className="flex min-h-56 flex-col rounded-3xl border border-black/8 bg-domary-cream p-5" key={topic.title}>
              <span className="text-2xl font-black text-domary-yellow">0{index + 1}.</span>
              <h3 className="mt-5 text-base font-black text-black">{topic.title}</h3>
              <p className="mt-2 flex-1 text-xs leading-6 text-black/50">{topic.text}</p>
              <Link className="focus-ring mt-5 w-fit border-b-2 border-domary-yellow pb-0.5 text-xs font-black text-black" href={topic.href}>{topic.action}</Link>
            </div>
          ))}
        </div>
      </SupportSection>

      <SupportSection title="Contato direto">
        {supportEmail ? (
          <div className="rounded-3xl bg-domary-black p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div><h3 className="font-black">Atendimento por e-mail</h3><p className="mt-1 text-xs leading-6 text-white/55">Ao escrever sobre uma compra, informe o número do pedido para agilizar a análise.</p></div>
            <a className="focus-ring mt-5 inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black sm:mt-0" href={`mailto:${supportEmail}`}>Enviar e-mail</a>
          </div>
        ) : (
          <div className="rounded-3xl border border-domary-yellow/40 bg-domary-yellow/[0.08] p-6">
            <h3 className="font-black text-black">Atendimento de pedidos</h3>
            <p className="mt-2 text-sm leading-6 text-black/55">Entre na sua conta para consultar compras e reunir as informações necessárias para o atendimento.</p>
            <Link className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-domary-black px-6 text-sm font-black text-white" href="/account/orders">Acessar meus pedidos</Link>
          </div>
        )}
      </SupportSection>

      <SupportSection title="Antes do atendimento">
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-2xl bg-black/[0.03] p-4"><strong className="block text-black">Tenha o pedido em mãos</strong><span className="mt-1 block text-xs">O número aparece em “Minhas compras”.</span></li>
          <li className="rounded-2xl bg-black/[0.03] p-4"><strong className="block text-black">Descreva o que aconteceu</strong><span className="mt-1 block text-xs">Inclua datas e detalhes relevantes.</span></li>
        </ul>
      </SupportSection>
    </SupportPageShell>
  );
}
