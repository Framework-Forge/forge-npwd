# Forge Phone

## Visao

Forge Phone e a evolucao do NPWD para um telefone persistente e fisico dentro do Forge-Core. Cada item `phone` representa um aparelho unico, com numero e dados proprios, que pode ser perdido, roubado, bloqueado e substituido sem confundir a identidade do personagem com a identidade do aparelho.

## Objetivo atual

Construir a fundacao de identidade do aparelho antes de refazer a tela inicial. A primeira entrega cria a fonte de verdade para aparelhos, perfis recuperaveis e linhas telefonicas, provisiona o item no primeiro uso e mantem compatibilidade temporaria com integracoes que ainda leem `players.phone_number`.

## Decisoes fixadas

- Nome do produto: Forge Phone.
- O recurso atual `npwd` permanece intacto enquanto `forge-phone` e desenvolvido e validado.
- Cada item telefonico possui `deviceId` e `serialNumber` exclusivos.
- O proprietario persistente e quem registrou o aparelho pela primeira vez (`registered_owner_citizenid`). Nao sera gravado portador atual nem usuario atual.
- O numero pertence ao perfil/linha telefonica, nao ao registro do jogador.
- `players.phone_number` nao vira JSON; durante a transicao ele e apenas um espelho de compatibilidade do aparelho ativo.
- PIN/senha nunca fica no metadata do item. Quando implementado, sera armazenado apenas como hash forte com salt no servidor.
- Recuperacao bloqueia o aparelho fisico antigo, revoga suas sessoes e transfere perfil, numero e configuracoes para um novo aparelho fisico.
- A tela inicial tera de 1 a 5 paginas independentes, grade reposicionavel, espacos vazios e cada aplicativo aparecendo uma unica vez.
- Eventos e exports `npwd:*` podem permanecer temporariamente como contrato de compatibilidade.

## Limites desta primeira fase

Incluido:

- modelo SQL normalizado;
- provisionamento idempotente do item no primeiro uso;
- metadata publico do aparelho;
- ativacao do numero daquele aparelho na sessao atual;
- bloqueio logico e base para substituicao;
- espelho temporario de `players.phone_number`;
- validacao de build e dos invariantes principais.

Nao incluido ainda:

- PIN e tela de bloqueio;
- fluxo de atendimento para recuperar aparelho perdido;
- migracao completa dos dados legados de todos os aplicativos;
- nova area de trabalho paginada;
- renomeacao imediata de todos os eventos internos `npwd:*`.

## Contexto tecnico

- Base: NPWD `3.15.1-beta.2`, em React, TypeScript e runtime FiveM.
- Framework autoritativo: `qbx_core`.
- Ponte comum: `pr_bridge`.
- Inventario atual: acessado pela interface normalizada do `pr_bridge`, sem dependencia direta do Forge Phone em um inventario especifico.
- Banco: MySQL/MariaDB via `mysql2` no backend atual.

## Criterios de sucesso

- Usar um item sem identidade cria exatamente um aparelho, um perfil e uma linha.
- Reutilizar o mesmo item nao cria registros duplicados.
- Dois itens do mesmo personagem podem possuir numeros distintos.
- Roubar ou transferir fisicamente o item nao altera seu proprietario registrado.
- Um aparelho bloqueado nao abre o telefone.
- O metadata nao contem PIN, senha, hash ou dados privados dos aplicativos.
- O NPWD atual continua disponivel como retorno seguro durante o desenvolvimento.

