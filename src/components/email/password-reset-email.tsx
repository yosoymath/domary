import * as React from "react";

type PasswordResetEmailProps = {
  firstName: string;
  resetUrl: string;
};

const fontFamily = "Arial, Helvetica, sans-serif";

export function PasswordResetEmail({ firstName, resetUrl }: PasswordResetEmailProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <meta content="light" name="color-scheme" />
        <meta name="x-apple-disable-message-reformatting" />
        <style>{`
          @media only screen and (max-width: 620px) {
            .email-gutter { padding-left: 20px !important; padding-right: 20px !important; }
            .email-header { padding-bottom: 24px !important; padding-top: 24px !important; }
            .email-header-label { display: none !important; }
            .email-content { padding-bottom: 48px !important; padding-top: 48px !important; }
            .email-title { font-size: 36px !important; letter-spacing: -1.6px !important; line-height: 1.08 !important; }
            .email-copy { font-size: 16px !important; }
            .email-cta-table, .email-cta-cell, .email-cta-link { width: 100% !important; }
            .email-cta-link { box-sizing: border-box !important; text-align: center !important; }
            .email-footer { padding-bottom: 28px !important; padding-top: 28px !important; }
          }
        `}</style>
      </head>
      <body
        style={{
          backgroundColor: "#f4f3ee",
          color: "#111111",
          fontFamily,
          margin: 0,
          padding: 0,
          width: "100%",
        }}
      >
        <span
          style={{
            display: "none",
            fontSize: "1px",
            lineHeight: "1px",
            maxHeight: 0,
            maxWidth: 0,
            opacity: 0,
            overflow: "hidden",
          }}
        >
          Use o link seguro para criar sua nova senha da Domary. Ele expira em 1 hora.
        </span>

        <table
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <tbody>
          <tr>
            <td
              className="email-gutter"
              style={{ backgroundColor: "#111111", padding: "0 32px" }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ borderCollapse: "collapse", margin: "0 auto", maxWidth: "760px", width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td className="email-header" style={{ padding: "30px 0" }}>
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        role="presentation"
                        style={{ borderCollapse: "collapse", width: "100%" }}
                      >
                        <tbody>
                          <tr>
                            <td>
                              <p
                                style={{
                                  color: "#ffffff",
                                  fontSize: "27px",
                                  fontWeight: 900,
                                  letterSpacing: "-1.6px",
                                  lineHeight: 1,
                                  margin: 0,
                                }}
                              >
                                DOMARY<span style={{ color: "#f5c400" }}>.</span>
                              </p>
                            </td>
                            <td
                              align="right"
                              className="email-header-label"
                              style={{
                                color: "#a3a3a3",
                                fontSize: "10px",
                                fontWeight: 700,
                                letterSpacing: "1.8px",
                                textTransform: "uppercase",
                              }}
                            >
                              Segurança da conta
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style={{ backgroundColor: "#f5c400", fontSize: 0, height: "5px", lineHeight: 0 }}>
              &nbsp;
            </td>
          </tr>

          <tr>
            <td
              className="email-gutter"
              style={{ backgroundColor: "#f4f3ee", padding: "0 32px" }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ borderCollapse: "collapse", margin: "0 auto", maxWidth: "760px", width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td className="email-content" style={{ padding: "72px 0 66px" }}>
                      <p
                        style={{
                          color: "#696965",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "2.2px",
                          margin: "0 0 18px",
                          textTransform: "uppercase",
                        }}
                      >
                        Redefinição de senha
                      </p>

                      <h1
                        className="email-title"
                        style={{
                          fontSize: "48px",
                          fontWeight: 800,
                          letterSpacing: "-2.5px",
                          lineHeight: 1.04,
                          margin: "0 0 26px",
                          maxWidth: "650px",
                        }}
                      >
                        Olá, {firstName}.
                        <br />
                        Vamos criar uma nova senha?
                      </h1>

                      <p
                        className="email-copy"
                        style={{
                          color: "#565653",
                          fontSize: "17px",
                          lineHeight: 1.65,
                          margin: "0 0 30px",
                          maxWidth: "590px",
                        }}
                      >
                        Recebemos uma solicitação para redefinir a senha da sua conta Domary. Para continuar, use o botão abaixo.
                      </p>

                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        className="email-cta-table"
                        role="presentation"
                        style={{ borderCollapse: "separate" }}
                      >
                        <tbody>
                          <tr>
                            <td
                              align="center"
                              className="email-cta-cell"
                              style={{ backgroundColor: "#f5c400", borderRadius: "6px" }}
                            >
                              <a
                                className="email-cta-link"
                                href={resetUrl}
                                style={{
                                  color: "#111111",
                                  display: "inline-block",
                                  fontSize: "15px",
                                  fontWeight: 800,
                                  padding: "17px 28px",
                                  textDecoration: "none",
                                }}
                              >
                                Criar nova senha&nbsp;&nbsp;→
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        role="presentation"
                        style={{ borderCollapse: "collapse", marginTop: "42px", maxWidth: "590px", width: "100%" }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ borderLeft: "3px solid #f5c400", padding: "3px 0 3px 18px" }}>
                              <p
                                style={{
                                  color: "#696965",
                                  fontSize: "13px",
                                  lineHeight: 1.65,
                                  margin: 0,
                                }}
                              >
                                Por segurança, este link é individual, só pode ser usado uma vez e expira em <strong style={{ color: "#111111" }}>1 hora</strong>.
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td
              className="email-gutter"
              style={{ backgroundColor: "#ffffff", borderTop: "1px solid #e5e4df", padding: "0 32px" }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ borderCollapse: "collapse", margin: "0 auto", maxWidth: "760px", width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td className="email-footer" style={{ padding: "34px 0" }}>
                      <p
                        style={{
                          color: "#5f5f5c",
                          fontSize: "13px",
                          lineHeight: 1.65,
                          margin: "0 0 10px",
                          maxWidth: "620px",
                        }}
                      >
                        Não solicitou esta alteração? Ignore esta mensagem. Sua senha atual continuará funcionando normalmente.
                      </p>
                      <p
                        style={{
                          color: "#92928e",
                          fontSize: "11px",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        A Domary nunca solicitará sua senha por e-mail. Não compartilhe nem encaminhe este link.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
        </table>
      </body>
    </html>
  );
}
