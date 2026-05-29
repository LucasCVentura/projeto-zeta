# Kira — Sistema para Clínicas de Estética

Sistema de gestão completo para profissionais de estética e biomédicos. Agenda, prontuário eletrônico, fotos de evolução, financeiro, estoque e pacotes de sessões — tudo em um plano único.

**Acesso:** [kiraclinic.com.br](https://kiraclinic.com.br)

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Banco de dados:** PostgreSQL via Supabase + Drizzle ORM
- **Auth:** NextAuth.js
- **WhatsApp:** Gupshup (lembretes e confirmações automáticas)
- **Deploy:** Vercel

---

## Estrutura do projeto

```
app/
├── src/
│   ├── app/                  # Rotas Next.js (App Router)
│   │   ├── (auth)/           # Login, cadastro
│   │   ├── (dashboard)/      # App autenticado
│   │   ├── (admin)/          # Painel interno
│   │   └── api/              # API routes (cron, webhooks, og)
│   ├── actions/              # Server actions
│   ├── components/           # Componentes React
│   ├── db/                   # Schema Drizzle + conexão
│   └── lib/                  # Utilitários, helpers
├── drizzle/                  # Migrations SQL
├── scripts/                  # Scripts de CI e pre-commit
└── tests/                    # Testes E2E (Playwright) + unitários (Vitest)
```

---

## Rodando localmente

**Pré-requisitos:** Node 20+, PostgreSQL local (ou Supabase)

```bash
cd app
cp .env.example .env.local   # preencher as variáveis
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Migrations

```bash
# Gerar migration a partir do schema
npx drizzle-kit generate

# Aplicar migrations
npx drizzle-kit migrate
```

---

## Testes

```bash
# Unitários
npm run test

# E2E (Playwright) — requer app rodando
npm run e2e:full
```

O pre-commit hook roda ambas as suítes automaticamente, além de validar migrations e banco de produção.

---

## Deploy

O deploy é feito automaticamente pelo Vercel a cada push na branch `main`. Migrations precisam ser aplicadas em produção manualmente antes do merge (o pre-commit hook verifica isso).

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL local |
| `PROD_DATABASE_URL` | Conexão PostgreSQL produção (Supabase) |
| `NEXTAUTH_SECRET` | Secret do NextAuth |
| `NEXTAUTH_URL` | URL base da aplicação |
| `GUPSHUP_API_KEY` | Chave da API WhatsApp (Gupshup) |
| `CRON_SECRET` | Token de autenticação dos cron jobs |
| `WHATSAPP_ENABLED` | `true` para habilitar envio de mensagens |
