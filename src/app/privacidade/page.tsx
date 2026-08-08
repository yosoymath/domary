import type { Metadata } from "next";
import Link from "next/link";
import { SupportPageShell, SupportSection } from "@/components/support/support-page-shell";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Saiba como a Domary coleta, utiliza e protege seus dados pessoais.",
};

export default function PrivacyPage() {
  return (
    <SupportPageShell
      activePath="/privacidade"
      description="Este aviso explica, de forma clara, quais informações usamos para operar a loja e quais escolhas você possui sobre seus dados."
      eyebrow="Seus dados"
      title="Privacidade e proteção"
    >
      <p className="mb-8 rounded-2xl bg-black/[0.03] px-4 py-3 text-xs text-black/45">Última atualização: 8 de agosto de 2026.</p>

      <SupportSection title="1. Quais dados tratamos">
        <p>Podemos tratar dados fornecidos por você, como nome, e-mail, telefone, CPF, data de nascimento, gênero opcional, endereços, senha protegida por hash e informações relacionadas aos seus pedidos.</p>
        <p>Também podemos registrar informações técnicas necessárias à segurança e ao funcionamento do site, como endereço IP, dispositivo, páginas acessadas, cookies essenciais e dados de sessão.</p>
      </SupportSection>

      <SupportSection title="2. Para que usamos os dados">
        <ul className="list-disc space-y-2 pl-5">
          <li>Criar e proteger sua conta.</li>
          <li>Processar compras, entregas, trocas e atendimento.</li>
          <li>Manter carrinho, favoritos e preferências da loja.</li>
          <li>Prevenir fraude, abuso e acessos não autorizados.</li>
          <li>Cumprir obrigações legais, fiscais e regulatórias.</li>
          <li>Enviar comunicações relacionadas à conta ou à compra e, quando permitido, novidades da Domary.</li>
        </ul>
      </SupportSection>

      <SupportSection title="3. Compartilhamento">
        <p>Os dados podem ser compartilhados, no limite necessário, com operadores que apoiam pagamento, entrega, hospedagem, comunicação, prevenção a fraude e suporte técnico. Esses parceiros devem tratar as informações para as finalidades contratadas e com medidas adequadas de segurança.</p>
        <p>Também poderemos compartilhar informações quando houver obrigação legal, ordem de autoridade competente ou necessidade de proteger direitos da Domary e de terceiros.</p>
      </SupportSection>

      <SupportSection title="4. Armazenamento e segurança">
        <p>Mantemos os dados pelo período necessário às finalidades descritas, ao cumprimento de obrigações legais e ao exercício regular de direitos. Depois disso, as informações são eliminadas ou anonimizadas quando aplicável.</p>
        <p>Adotamos medidas técnicas e organizacionais para reduzir riscos de acesso indevido, perda ou alteração. As senhas são armazenadas somente como hash bcrypt e não podem ser consultadas em texto puro.</p>
      </SupportSection>

      <SupportSection title="5. Seus direitos">
        <p>Nos termos da LGPD, você pode solicitar confirmação e acesso ao tratamento, correção, informações sobre compartilhamento e, quando aplicável, anonimização, bloqueio, portabilidade, revogação do consentimento ou eliminação.</p>
        <p>Algumas informações podem ser mantidas quando houver obrigação legal ou outra hipótese autorizada pela legislação.</p>
        <div className="flex flex-wrap gap-3">
          <Link className="focus-ring inline-flex min-h-12 items-center rounded-full bg-domary-black px-6 font-black text-white" href="/contato">Solicitar atendimento</Link>
          <Link className="focus-ring inline-flex min-h-12 items-center rounded-full border border-black/12 px-6 font-black text-black" href="/account/profile">Revisar meu perfil</Link>
        </div>
      </SupportSection>

      <SupportSection title="6. Cookies e atualizações">
        <p>Cookies e tecnologias semelhantes podem ser usados para manter sua sessão, lembrar preferências e garantir funções essenciais. Este aviso poderá ser atualizado para refletir mudanças na loja ou na legislação; a data no início da página indicará a versão mais recente.</p>
        <a className="focus-ring inline-flex text-xs font-bold text-black underline decoration-domary-yellow decoration-2 underline-offset-4" href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares" rel="noreferrer" target="_blank">Conhecer os direitos do titular na ANPD ↗</a>
      </SupportSection>
    </SupportPageShell>
  );
}
