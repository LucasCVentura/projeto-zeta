# E2E (Playwright)

## Requisitos

Crie um `.env.e2e` na raiz:

```bash
cp .env.e2e.example .env.e2e
```

Valores padrão:

```bash
E2E_USER_EMAIL="e2e@kira.local"
E2E_USER_PASSWORD="E2E@123456"
E2E_USER_NAME="E2E User"
E2E_ALLOW_REMOTE_DB=0
```

Antes de rodar os testes, o script prepara automaticamente esse usuário no banco local.

## Comandos

```bash
npm run e2e:install
npm run e2e
```

Modo UI:

```bash
npm run e2e:ui
```
