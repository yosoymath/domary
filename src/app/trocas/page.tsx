import type { Metadata } from "next";
import Link from "next/link";
import { SupportPageShell, SupportSection } from "@/components/support/support-page-shell";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Consulte os prazos e o processo para solicitar uma troca ou devolução na Domary.",
};

const steps = [
  ["Solicite", "Acesse Fale conosco e informe o número do pedido, os itens envolvidos e o motivo da solicitação."],
  ["Aguarde as instruções", "A equipe orientará sobre preparação, postagem ou coleta do produto, conforme o caso."],
  ["Envie o produto", "Proteja a peça durante o transporte e, sempre que possível, envie etiquetas e acessórios recebidos."],
  ["Acompanhe a conclusão", "Após o recebimento e a conferência, você receberá a orientação de troca, crédito ou reembolso aplicável."],
] as const;

export default function ExchangesPage() {
  return (
    <SupportPageShell
      activePath="/trocas"
      description="Veja como solicitar atendimento para arrependimento, troca ou problema com um produto recebido."
      eyebrow="Pós-venda"
      title="Trocas e devoluções"
    >
      <SupportSection title="Direito de arrependimento">
        <p>Em compras realizadas pela internet, você pode solicitar a desistência em até <strong className="text-black">7 dias corridos</strong>, contados do recebimento do produto, conforme o artigo 49 do Código de Defesa do Consumidor.</p>
        <p>Para iniciar a solicitação, entre em contato dentro desse prazo e informe o número do pedido. Os valores pagos serão tratados de acordo com a forma de pagamento e as regras aplicáveis ao caso.</p>
        <Link className="focus-ring inline-flex min-h-12 items-center rounded-full bg-domary-yellow px-6 font-black text-domary-black" href="/contato">Iniciar atendimento</Link>
      </SupportSection>

      <SupportSection title="Produto com problema">
        <p>Se o item chegar com avaria, divergência ou apresentar defeito, registre a situação assim que possível. Fotografias da embalagem e do produto podem ajudar a tornar a análise mais rápida, sem limitar os direitos previstos em lei.</p>
        <p>Não descarte o produto nem seus componentes antes de receber as orientações de atendimento.</p>
      </SupportSection>

      <SupportSection title="Como funciona">
        <ol className="grid gap-4 sm:grid-cols-2">
          {steps.map(([title, text], index) => (
            <li className="rounded-3xl border border-black/8 bg-domary-cream p-5" key={title}>
              <span className="text-2xl font-black text-domary-yellow">0{index + 1}.</span>
              <h3 className="mt-4 font-black text-black">{title}</h3>
              <p className="mt-2 text-xs leading-6">{text}</p>
            </li>
          ))}
        </ol>
      </SupportSection>

      <SupportSection title="Informações importantes">
        <ul className="list-disc space-y-2 pl-5">
          <li>Não envie produtos por conta própria antes de receber as instruções de atendimento.</li>
          <li>Sempre que possível, conserve etiquetas, acessórios e a embalagem recebida.</li>
          <li>Os prazos de transporte podem variar conforme a localidade e a modalidade de envio.</li>
          <li>Esta página não reduz garantias ou outros direitos assegurados pela legislação brasileira.</li>
        </ul>
        <a className="focus-ring inline-flex text-xs font-bold text-black underline decoration-domary-yellow decoration-2 underline-offset-4" href="https://www.gov.br/mj/pt-br/assuntos/noticias/consumidor-tem-direito-ao-arrependimento-em-compras-on-line" rel="noreferrer" target="_blank">Consultar orientação oficial do Ministério da Justiça ↗</a>
      </SupportSection>
    </SupportPageShell>
  );
}
