# Domary

Base arquitetural de um e-commerce de roupas e acessórios, construída com Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM e NextAuth.js.

## Arquitetura recomendada

```text
domary/
├── prisma/
│   ├── migrations/                  # Migrações versionadas
│   ├── schema.prisma                # Modelagem PostgreSQL
│   └── seed.ts                      # Dados de desenvolvimento (próxima etapa)
├── public/
│   └── images/                      # Imagens e identidade visual
├── src/
│   ├── app/
│   │   ├── (store)/                 # Rotas públicas da loja
│   │   │   ├── produtos/[slug]/     # Detalhe e seleção de variante
│   │   │   ├── carrinho/            # Carrinho
│   │   │   └── checkout/            # Simulação de checkout
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── cadastro/
│   │   ├── admin/                   # Rotas protegidas por role ADMIN
│   │   │   ├── produtos/            # CRUD e estoque por variante
│   │   │   └── pedidos/             # Gestão de pedidos
│   │   ├── api/auth/[...nextauth]/   # Route Handler do NextAuth
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── actions/                     # Server Actions por domínio
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   └── products.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── store/
│   │   ├── admin/
│   │   └── ui/                      # Componentes reutilizáveis
│   ├── lib/
│   │   ├── auth.ts                  # Configuração Auth.js/NextAuth
│   │   ├── prisma.ts                # Cliente Prisma singleton
│   │   └── validations/             # Schemas de entrada (ex.: Zod)
│   └── types/                       # Tipos e extensões de sessão
├── .env.example
├── next.config.ts
├── postcss.config.mjs
└── package.json
```

As pastas de rotas são introduzidas conforme cada módulo for implementado. A Home inicial permanece em `src/app/page.tsx`; movê-la futuramente para `src/app/(store)/page.tsx` não altera a URL `/`.

## Decisões de domínio

- **Estoque por variante:** `ProductVariant` representa cada combinação de tamanho e cor, com SKU e saldo próprios. O estoque total exibido no admin é a soma das variantes ativas.
- **Preço seguro:** valores monetários usam `Decimal(10,2)`, nunca ponto flutuante.
- **Histórico de pedidos:** `OrderItem` guarda nome, SKU, atributos e preço no momento da compra.
- **Endereço imutável:** `shippingAddress` é um snapshot JSON e não muda se o cliente editar o cadastro depois.
- **Exclusão segura:** produtos e usuários referenciados por pedidos usam `Restrict`; catálogo fora de linha deve ser arquivado.
- **Autorização:** autenticação e autorização são responsabilidades separadas. O middleware protege `/admin`, mas cada Server Action também deve validar `session.user.role === "ADMIN"`.
- **Checkout e estoque:** criação do pedido e baixa de estoque devem ocorrer em uma transação Prisma, usando atualização condicional para impedir estoque negativo.

## Como executar

Requer Node.js 20.9+ e PostgreSQL.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

Abra `http://localhost:3000`.

## Autenticação

O fluxo usa Auth.js v5 com sessão JWT e provedor Credentials. O cadastro é uma Server Action que valida os dados, normaliza o e-mail e salva somente o hash bcrypt da senha. Gere o segredo local antes de iniciar:

```bash
npx auth secret
```

Rotas disponíveis:

- `/register`: cadastro de cliente.
- `/login`: login com e-mail e senha.
- `/api/auth/*`: handlers internos do Auth.js.

## Área do cliente

As páginas em `/account` usam um Data Access Layer server-only que valida a sessão e confirma a existência do usuário no PostgreSQL antes de qualquer consulta ou alteração.

- `/account`: resumo da conta, pedidos recentes e completude do perfil.
- `/account/profile`: edição de nome e telefone; o e-mail permanece protegido até existir verificação de identidade.
- `/account/orders`: histórico de compras com status, pagamento e total.
- `/account/orders/[number]`: itens, valores e endereço preservado no pedido.
- `/account/favorites`: produtos favoritos persistidos pela relação única `Favorite`.

O menu do perfil no cabeçalho exibe nome, e-mail, sessão ativa, atalhos da conta, painel administrativo para usuários `ADMIN` e logout. Produtos reais com status `ACTIVE` aparecem na Home e podem ser favoritados; os cards demonstrativos usados quando o catálogo está vazio não oferecem uma ação falsa.

## Próximas etapas sugeridas

1. Configurar NextAuth Credentials, hashing com bcrypt e cadastro de clientes.
2. Criar seed, catálogo vindo do PostgreSQL e detalhe do produto.
3. Implementar carrinho persistido e checkout transacional.
4. Proteger e construir o painel administrativo, CRUD, estoque e pedidos.
5. Adicionar testes de domínio, acessibilidade e fluxo de compra.
