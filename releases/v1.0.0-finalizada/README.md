# Versão finalizada v1.0.0 (snapshot interno)

Este diretório organiza a **versão finalizada** já estabilizada no repositório `ml-gestao-integral`.

## Objetivo

Facilitar publicação/consulta da versão que já passou por validações de build, testes e typecheck.

## Estado técnico desta versão

- `pnpm check` ✅
- `pnpm test` ✅
- `pnpm build` ✅
- `pnpm dev` sobe localmente (com aviso esperado quando `OAUTH_SERVER_URL` não está definido)

## Como executar localmente

```bash
pnpm install
cp .env.example .env
# preencher DATABASE_URL, JWT_SECRET, OAUTH_SERVER_URL e credenciais necessárias
pnpm db:push
pnpm dev
```

## Observações de operação e compliance (Brasil)

1. **CLT**: validar cálculos e regras de folha/férias/encargos com contador responsável antes de produção.
2. **LGPD**: restringir acesso por perfil (RBAC), aplicar mínimo privilégio e manter trilha de auditoria.
3. **Segurança**: não versionar segredos; manter apenas em `.env`/cofre de segredos.

## Publicação no GitHub

Este conteúdo deve ser versionado por commit e enviado ao repositório remoto para ficar disponível no GitHub.
Se o remoto ainda não estiver configurado neste ambiente, configurar antes do `git push`.
