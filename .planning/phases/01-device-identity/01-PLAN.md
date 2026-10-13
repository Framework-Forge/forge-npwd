# Plano 01 - Identidade unica do aparelho

## Objetivo

Entregar a primeira fatia executavel da fundacao de aparelhos unicos sem substituir o NPWD em producao.

## Tarefas

1. Adicionar configuracao do dispositivo e tabelas normalizadas ao SQL.
2. Criar repositorio transacional para perfil, aparelho e linha.
3. Criar servico idempotente de provisionamento e ativacao.
4. Integrar item `phone` pela API normalizada do `pr_bridge`.
5. Ativar o numero do aparelho na sessao e projetar o valor legado.
6. Expor operacoes server-side para consultar e bloquear aparelho.
7. Validar build, SQL e invariantes de seguranca.

## Riscos

- O SQL precisa ser instalado antes de ativar o novo recurso.
- Consumidores externos ainda podem ler `players.phone_number`; o espelho e temporario e documentado.
- A renomeacao total dos eventos sera feita somente depois da migracao dos consumidores.

## Verificacao

- Build TypeScript completo.
- Revisao do diff para garantir que `resources/[voice]/npwd` nao mudou.
- Busca automatizada por segredos no metadata.
- Teste em servidor: primeiro uso, segundo uso, dois aparelhos e aparelho bloqueado.

