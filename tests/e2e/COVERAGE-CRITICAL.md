# Cobertura E2E de Fluxos Críticos

Status atual (26/05/2026): aproximadamente **88% a 92%** dos fluxos críticos cobertos.

## Fluxos Cobertos

- [x] Autenticação: login válido e inválido (`auth.spec.ts`)
- [x] Sessão: logout e retorno ao login (`session.spec.ts`)
- [x] Segurança de rota: acesso sem sessão redireciona para login (`security.spec.ts`, `critical-pack.spec.ts`)
- [x] Agenda: abrir dia e visualizar slots (`agenda.spec.ts`)
- [x] Agenda: criar agendamento (`booking.spec.ts`)
- [x] Agenda: bloquear horário (`access-and-block.spec.ts`)
- [x] Agenda: alteração de status e início de atendimento (`operations-core.spec.ts`)
- [x] Consulta: salvar anotação clínica (`operations-core.spec.ts`)
- [x] Clientes: cadastro de cliente (`clients.spec.ts`, `critical-pack.spec.ts`)
- [x] Clientes: robustez para cliente inexistente (`robustness.spec.ts`)
- [x] Configurações: navegação principal e seções internas (`navigation.spec.ts`, `navigation-pack-2.spec.ts`)
- [x] Procedimentos: CRUD (`procedures-crud.spec.ts`)
- [x] Pacotes: CRUD (`packages-crud.spec.ts`)
- [x] Estoque: CRUD (`supplies-crud.spec.ts`)
- [x] Módulos principais: ajuda/estoque/financeiro acessíveis (`modules.spec.ts`, `navigation.spec.ts`)
- [x] PWA/assets críticos (`critical-pack.spec.ts`)

## Fluxos Ainda Parciais / Pendentes

- [ ] Ficha completa do cliente com documentos (há incidência de erro 500 intermitente no ambiente)
- [ ] Fluxo completo de pacotes na ficha da cliente (atribuir pacote + agendar sessões + consumo)
- [ ] Pós-consulta com confirmação de disparos WhatsApp ponta a ponta
- [ ] Fluxos de erro avançados (permissões por papel em ações específicas)

## Estratégia de Execução

- `smoke` (PR gate): fluxos essenciais para evitar regressão crítica de uso diário.
- `full` (nightly/pré-release): suíte completa.

## Comandos

```bash
npm run e2e:smoke
npm run e2e:full
```
