# Aviso de pedidos por WhatsApp

Quando o PagBank confirma o pagamento de um pedido, a Domary envia um resumo do pedido para o WhatsApp do responsável pela loja.

Dois provedores são suportados:

| Provedor | Custo | Para quem envia | Quando usar |
| --- | --- | --- | --- |
| [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) | **Gratuito** (uso pessoal) | Só para o número que ativou a chave | Padrão: aviso para o dono da loja |
| [Green-API](https://green-api.com/en) | **Gratuito** no plano Developer (até 3 conversas) | Qualquer número, a partir de um WhatsApp conectado por QR Code | Se o CallMeBot não aceitar novos usuários |
| [Z-API](https://z-api.io) | Pago | Qualquer número, a partir de um chip conectado por QR Code | Se precisar enviar de um número da loja ou para outras pessoas |

O primeiro provedor configurado é usado, nesta ordem: CallMeBot (`CALLMEBOT_API_KEY`), Green-API (`GREENAPI_ID_INSTANCE` + `GREENAPI_API_TOKEN`), Z-API.

## Como funciona

1. O webhook `/api/webhooks/pagbank` recebe a confirmação e chama `applyPagBankPaymentUpdate`.
2. Uma atualização condicional (`paymentStatus != PAID`) identifica a **primeira** confirmação. Reenvios do mesmo evento não geram nova mensagem.
3. `notifyOrderPaid` (`src/lib/notifications/whatsapp.ts`) busca o pedido, monta o texto (`src/lib/notifications/order-message.ts`) e envia pelo provedor configurado.
4. Se o envio falhar, o erro é registrado no log e o pedido continua confirmado normalmente. Não há nova tentativa automática.

A mensagem contém: número do pedido, data e hora (horário de Brasília), forma de pagamento, nome, telefone e e-mail do cliente, itens com tamanho, cor, SKU e valores, total e observação. O CPF nunca é enviado.

## Configuração com CallMeBot (gratuito)

1. No celular que vai **receber** os avisos, salve o contato **+34 644 20 47 56**.
2. Envie para ele pelo WhatsApp a mensagem: `I allow callmebot to send me messages`
3. Aguarde a resposta com a sua **APIKEY** (se não chegar em 2 minutos, tente de novo após 24 horas).
4. Preencha no `.env` (e nas variáveis de ambiente da hospedagem):

```dotenv
# Número que RECEBE os avisos (o mesmo que ativou a chave): DDI + DDD + número, só dígitos
WHATSAPP_NOTIFY_PHONE=5511999998888
CALLMEBOT_API_KEY=123456
```

5. Teste o envio:

```bash
npm run whatsapp:test
```

Limitações do CallMeBot gratuito: só envia para o próprio número que ativou a chave, não envia para grupos nem outros contatos, e as mensagens chegam do número do bot (não da loja). É um serviço de terceiros sem garantia de entrega; para avisar mais de uma pessoa, cada uma precisaria ativar a sua própria chave (hoje o código suporta um destinatário).

## Configuração com Green-API (gratuito, plano Developer)

O Green-API envia **a partir de um WhatsApp seu** (conectado por QR Code) **para** o número em `WHATSAPP_NOTIFY_PHONE`. Use dois números diferentes: um que envia (de preferência um chip/WhatsApp Business da loja) e o seu, que recebe.

1. Crie uma conta em <https://console.green-api.com> e uma instância no plano **Developer** (gratuito, 1 instância por conta, até 3 conversas por mês).
2. Na instância, leia o **QR Code** com o WhatsApp que vai **enviar** os avisos. Como no Z-API, não é um serviço oficial do WhatsApp: use um número dedicado.
3. Copie **apiUrl**, **idInstance** e **apiTokenInstance** da página da instância.
4. Preencha no `.env` (sem `CALLMEBOT_API_KEY`):

```dotenv
WHATSAPP_NOTIFY_PHONE=5511999998888
GREENAPI_API_URL=https://7103.api.greenapi.com   # o apiUrl exibido no console
GREENAPI_ID_INSTANCE=7103000000
GREENAPI_API_TOKEN=...
```

5. Teste com `npm run whatsapp:test`.

## Configuração com Z-API (pago)

1. Crie uma conta em <https://z-api.io> e uma **instância**.
2. No painel da instância, leia o **QR Code** com o WhatsApp que vai **enviar** os avisos. Use um chip dedicado à loja: o Z-API não é um serviço oficial do WhatsApp e o número conectado pode ser bloqueado.
3. Copie o **ID da instância** e o **Token da instância**. Se a opção de segurança da conta estiver ativa, copie também o **Client-Token** (em *Segurança*).
4. Preencha no `.env` (sem as variáveis do CallMeBot e do Green-API):

```dotenv
WHATSAPP_NOTIFY_PHONE=5511999998888
ZAPI_INSTANCE_ID=...
ZAPI_INSTANCE_TOKEN=...
# Opcional: só se a segurança por Client-Token estiver ativa na conta
ZAPI_CLIENT_TOKEN=...
```

Sem nenhuma configuração, os pedidos funcionam normalmente e apenas o aviso deixa de ser enviado (um alerta aparece no log).

## Problemas comuns

- **CallMeBot "APIKey is invalid":** a chave não corresponde ao número em `WHATSAPP_NOTIFY_PHONE`; os dois precisam ser do mesmo celular.
- **Green-API HTTP 401/403/466:** token errado, instância não autorizada (leia o QR Code de novo) ou limite de 3 conversas do plano gratuito atingido.
- **Z-API HTTP 400/401/403:** ID ou token da instância incorretos, ou `ZAPI_CLIENT_TOKEN` ausente com a segurança ativa.
- **Z-API: envio deu certo, mas a mensagem não chega:** confira no painel se a instância continua **conectada** (leia o QR Code de novo se cair).
- **Número errado:** `WHATSAPP_NOTIFY_PHONE` deve começar com `55`; `+`, espaços e traços são removidos automaticamente.

## Trocar de provedor

Todo o envio fica em `sendWhatsAppMessage` (`src/lib/notifications/whatsapp.ts`). Para outro serviço (ex.: API oficial do WhatsApp/Meta), adicione uma função de envio ao lado de `sendWithCallMeBot`, `sendWithGreenApi` e `sendWithZApi`.
