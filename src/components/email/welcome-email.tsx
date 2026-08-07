import * as React from "react";

type WelcomeEmailProps = {
  firstName: string;
  shopUrl: string;
};

export function WelcomeEmail({ firstName, shopUrl }: WelcomeEmailProps) {
  return (
    <div style={{ backgroundColor: "#f2f2ee", color: "#111111", fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: "32px 12px" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", margin: "0 auto", maxWidth: "600px", overflow: "hidden" }}>
        <div style={{ backgroundColor: "#111111", padding: "26px 32px" }}>
          <p style={{ color: "#ffffff", fontSize: "26px", fontWeight: 900, letterSpacing: "-1.5px", margin: 0 }}>
            DOMARY<span style={{ color: "#f5c400" }}>.</span>
          </p>
        </div>

        <div style={{ padding: "42px 32px 36px" }}>
          <p style={{ color: "#777777", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", margin: "0 0 14px", textTransform: "uppercase" }}>Bem-vindo à comunidade</p>
          <h1 style={{ fontSize: "34px", letterSpacing: "-1.5px", lineHeight: 1.05, margin: "0 0 20px" }}>Olá, {firstName}! Sua conta está pronta.</h1>
          <p style={{ color: "#555555", fontSize: "16px", lineHeight: 1.65, margin: "0 0 24px" }}>
            Que bom ter você com a gente. Na Domary, você encontra roupas e acessórios para transformar o básico em presença — com estilo, conforto e personalidade.
          </p>

          <a href={shopUrl} style={{ backgroundColor: "#f5c400", borderRadius: "999px", color: "#111111", display: "inline-block", fontSize: "14px", fontWeight: 800, padding: "16px 26px", textDecoration: "none" }}>
            Explorar a Domary
          </a>

          <div style={{ borderTop: "1px solid #eeeeea", marginTop: "36px", paddingTop: "26px" }}>
            <p style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 14px" }}>Com sua conta, você pode:</p>
            <p style={{ color: "#666666", fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
              ✓ Salvar seus produtos favoritos<br />
              ✓ Acompanhar pedidos e entregas<br />
              ✓ Manter seus dados de compra atualizados<br />
              ✓ Receber uma experiência personalizada
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: "#111111", padding: "22px 32px" }}>
          <p style={{ color: "#999999", fontSize: "11px", lineHeight: 1.6, margin: 0 }}>
            Você recebeu esta mensagem porque uma conta foi criada com este endereço na Domary. A Domary nunca solicitará sua senha por e-mail.
          </p>
        </div>
      </div>
    </div>
  );
}
