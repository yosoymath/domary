@AGENTS.md

# Domary

E-commerce de roupas e acessórios (pt-BR). Loja pública, área do cliente, painel admin e checkout PagBank.

## Stack

- Next.js 16 (App Router, Server Actions) + React 19 + TypeScript — ver aviso em AGENTS.md: consulte `node_modules/next/dist/docs/` antes de usar APIs do Next.
- Tailwind CSS 4 (alguns CSS Modules), tema claro/escuro.
- PostgreSQL + Prisma 6 (`prisma/schema.prisma`, migrations em `prisma/migrations/`).
- Auth.js / NextAuth v5 beta: Credentials (e-mail + senha bcrypt), sessão JWT (`src/auth.ts`).
- Zod 4 para validação, Resend + React Email para e-mails, Cloudinary para imagens, ViaCEP para CEP.
- Vitest para testes.

## Comandos

```bash
npm run dev          # servidor local (http://localhost:3000)
npm test             # vitest run
npm run typecheck    # tsc --noEmit
npm run build        # prisma generate && next build
npm run db:migrate   # prisma migrate dev
npm run db:studio
```

Antes de concluir uma mudança, rode `npm run typecheck` e `npm test`.

## Estrutura

- `src/app/` — rotas: `/`, `/produtos`, `/produtos/[slug]`, `/carrinho`, `/checkout/retorno`, `/account/*`, `/admin/*`, auth (`/login`, `/register`, `/forgot-password`, `/reset-password/[token]`), páginas institucionais.
- `src/app/api/` — `auth/[...nextauth]`, `checkout/pagbank`, `webhooks/pagbank`, `admin/uploads` (Cloudinary), `postal-code/[postalCode]` (ViaCEP).
- `src/actions/` — Server Actions por domínio (`auth`, `account`, `admin`).
- `src/lib/` — regras de negócio: `checkout/` (preço, pedidos, retirada), `pagbank/` (cliente, assinatura, webhook), `auth/` (`requireAdmin`, `getCurrentUser` — server-only), `validations/` (schemas Zod), `cart.ts`, `email/`.
- `src/components/` — `store`, `account`, `admin`, `auth`, `layout`, `email`, `ui`.
- Alias de import: `@/` → `src/`.

## Regras de domínio (não quebrar)

- Estoque é **por variante** (`ProductVariant`: tamanho + cor, SKU próprio).
- Dinheiro: `Decimal(10,2)` no banco; cálculos em **centavos inteiros** (`moneyToCents`, `centsToDecimal` em `src/lib/checkout/pricing.ts`). Nunca usar float para valores.
- O servidor sempre recalcula preços e promoções; nunca confiar no preço vindo do carrinho (o carrinho fica em `localStorage`).
- Criação de pedido e baixa de estoque na mesma transação Prisma, com atualização condicional para não deixar estoque negativo.
- `OrderItem` guarda snapshot (nome, SKU, atributos, preço). `shippingAddress` guarda snapshot da modalidade — hoje só `STORE_PICKUP`.
- Pedido só vira pago via webhook PagBank autenticado (`x-authenticity-token`) e com valor conferido; eventos repetidos não podem devolver estoque duas vezes. Detalhes em `docs/pagbank.md`.
- Autorização: toda Server Action/rota admin chama `requireAdmin()`; não existe middleware protegendo `/admin`. Dados do cliente passam por `getCurrentUser()`.
- Produtos/usuários referenciados por pedidos usam `onDelete: Restrict` — arquive (`ARCHIVED`) em vez de apagar.

## Convenções

- Textos de UI, mensagens de erro e commits em português (commits no estilo `feat: ...`, `fix: ...`).
- Validar entrada com Zod em `src/lib/validations/` antes de tocar no banco.
- Segredos só em `.env` (não versionado). Variáveis: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, `CLOUDINARY_URL`, `PAGBANK_ENV`, `PAGBANK_TOKEN`, `DOMARY_SHIPPING_AMOUNT_CENTS`, `PAGBANK_INSTALLMENTS_LIMIT`, `PAGBANK_INTEREST_FREE_INSTALLMENTS`, `WHATSAPP_NOTIFY_PHONE`, `CALLMEBOT_API_KEY`, `GREENAPI_API_URL`, `GREENAPI_ID_INSTANCE`, `GREENAPI_API_TOKEN`, `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN`.
- Aviso de pedido pago por WhatsApp (primeiro provedor configurado: CallMeBot, Green-API ou Z-API): disparado pelo webhook PagBank só na transição para `PAID` (`applyPagBankPaymentUpdate` retorna `"newly_paid"`); `notifyOrderPaid` nunca lança erro. Ver `docs/whatsapp.md`.
- O README está parcialmente desatualizado (cita `seed.ts`, grupos `(store)`/`(auth)` e middleware que não existem); prefira o código.
