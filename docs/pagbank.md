# Integração PagBank

A Domary usa o Checkout PagBank com redirecionamento. O servidor recalcula preços e promoções, reserva o estoque, cria o pedido local e solicita uma página de pagamento ao PagBank. O pedido só é confirmado depois de um webhook autenticado.

## Variáveis de ambiente

Adicione estas variáveis ao `.env` local e ao ambiente de hospedagem. Nunca envie o token ao navegador nem o registre no Git.

```dotenv
PAGBANK_ENV=sandbox
PAGBANK_TOKEN=token_do_portal_sandbox
APP_URL=https://url-publica-de-teste.example

# Frete fixo em centavos. Em Sandbox, a ausência equivale a zero.
# Em produção, esta variável é obrigatória, inclusive quando o frete for grátis.
DOMARY_SHIPPING_AMOUNT_CENTS=0

# O comprador paga os juros por padrão.
PAGBANK_INSTALLMENTS_LIMIT=3
PAGBANK_INTEREST_FREE_INSTALLMENTS=0
```

`APP_URL` precisa ser pública para o PagBank alcançar `/api/webhooks/pagbank`. Em produção, ela obrigatoriamente deve usar HTTPS. Para testar localmente, publique temporariamente a porta do Next.js por meio de um túnel HTTPS e coloque a URL gerada em `APP_URL`.

## Preparar o Sandbox

1. Entre no Portal do Desenvolvedor PagBank com a conta de testes e copie o token da aba **Tokens**.
2. Configure as variáveis acima e execute `npm run dev`.
3. Cadastre um cliente na loja, preencha um endereço principal e coloque no carrinho um produto ativo com estoque.
4. Finalize uma compra pelo botão **Ir para o pagamento**.
5. Se o Checkout Sandbox solicitar um cartão, teste uma aprovação e uma recusa usando somente os cartões fictícios publicados pelo PagBank. Nunca use cartão real no Sandbox.
6. Confirme que um pagamento aprovado aparece como **Pago** em `/account/orders` e que uma recusa aparece como **Pagamento recusado**.
7. Confirme o estoque: ele diminui quando o pedido é criado e permanece reservado enquanto o checkout aceitar uma nova tentativa. A reserva é devolvida quando o checkout expira.

Cartões oficiais para cenários básicos:

- Visa aprovado: `4539620659922097`, validade `12/2026`, CVV `123`.
- Visa recusado: `4929291898380766`, validade `12/2026`, CVV `123`.
- Mastercard aprovado: `5240082975622454`, validade `12/2026`, CVV `123`.
- Mastercard recusado: `5530062640663264`, validade `12/2026`, CVV `123`.

Consulte sempre a lista atual em <https://developer.pagbank.com.br/docs/cartoes-de-teste>.

## Verificações locais

```bash
npm test
npm run typecheck
npm run build
```

O webhook valida `x-authenticity-token` usando SHA-256 sobre `{PAGBANK_TOKEN}-{corpo bruto}` e também compara o valor pago em centavos com o total do pedido. Eventos repetidos não devolvem estoque mais de uma vez.

## Produção

Depois dos testes, solicite a homologação obrigatória no PagBank. Após a aprovação:

1. Troque para `PAGBANK_ENV=production`.
2. Use o token de produção gerado em **Vendas > Integrações**.
3. Configure a URL HTTPS definitiva em `APP_URL`.
4. Defina explicitamente o frete e as condições de parcelamento.
5. Adicione proteção contra automação (como reCAPTCHA ou rate limiting) antes de abrir o checkout ao público.
6. Faça uma compra real de baixo valor e valide pagamento, webhook, estoque e estorno antes de liberar a loja.

Documentação de homologação: <https://developer.pagbank.com.br/docs/solicitar-homologacao>.
