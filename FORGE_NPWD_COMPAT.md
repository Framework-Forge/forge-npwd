# Forge NPWD: integração e compatibilidade internas

O único telefone ativo é `forge-npwd`. O ciclo do personagem, o vínculo do item e a compatibilidade legada ficam no próprio telefone. O PR Bridge continua separado como camada geral de adaptadores da base. Não instale nem inicie `forge-npwd-bridge` ou `[forge-npwd-compat]`.

## Inicialização

Inicie o framework, o inventário e o driver SQL configurados; depois `pr_bridge`, `pma-voice`, `screenshot-basic` e `forge-npwd`. Os aplicativos e a loja são recursos funcionais independentes, não proxies: inicie somente os que usa. Disponibilize as builds dos aplicativos antes de abrir o telefone e respeite suas dependências de manifesto.

```text
ensure pr_bridge
ensure pma-voice
ensure screenshot-basic
ensure forge-npwd
# Opcional:
ensure forge-npwd-shop
```

Não inicie o NPWD original junto do Forge NPWD. O `server.cfg` desta base já foi ajustado. Aplique a migração em RR planejado; nenhum serviço ativo foi reiniciado automaticamente.

## Framework e item

`apps/game/server/player_bridge.lua` usa `pr_lib.framework.GetPhoneProfile`, `GetAllPlayers`, os eventos normalizados do PR Bridge e `pr_lib.inventory.RegisterUsableItem`. O cliente usa o mesmo adaptador para verificar item/personagem e abrir o telefone. Não crie outro loop de `newPlayer`/`unloadPlayer`.

O contrato `GetPhoneProfile` retorna source, identificador estável do personagem, nomes e número opcional. Sem número prévio, o telefone usa seu gerador e armazenamento configurados. Os adaptadores de framework continuam no PR Bridge; não há imports ativos diretos de QB/QBX/ESX/ND no carregador do telefone. Configure os providers reais e teste cada combinação na cidade.

O item vem de `config.json` → `device.itemName`, padrão `phone`. O uso não consome o aparelho. `usePhoneSlot` consulta o slot verdadeiro no servidor, valida o nome do item e ignora metadata enviada pelo cliente. Para inventário que não despache itens utilizáveis pelo adaptador, configure sua ação cliente como `forge-npwd.usePhoneItem`, ou evento `forge-npwd:client:usePhoneItem`, passando o slot. O ox_inventory da Forge recebe esse vínculo automaticamente.

`general.useResourceIntegration` é habilitado internamente. Convars antigas de framework não iniciam um segundo loader. O banco ainda precisa de `mysql_connection_string` e das colunas configuradas em `database`: selecionar outro framework no PR Bridge não converte o esquema SQL. `device.mirrorLegacyPhoneNumber` controla o espelhamento no campo legado configurado, sem SQL fixo para uma tabela QBX.

## Chamadas antigas, sem recursos extras

```lua
-- Código antigo, sem alterar o consumidor:
exports['npwd']:isPhoneVisible()
exports['npwd']:sendNPWDMessage('forge-npwd-mail', 'newMail', {})

-- Código novo:
exports['forge-npwd']:isPhoneVisible()
exports['forge-npwd']:sendForgeNPWDMessage('forge-npwd-mail', 'newMail', {})
```

`compat/exports.lua` registra os eventos locais de resolução `__cfx_export_<nome>_<método>` do FiveM. O roteamento usa `compat/aliases.json` e `compat/exports.json`, encaminha uma única chamada ao provider atual e mantém argumentos, valores de retorno e separação cliente/servidor. Esses eventos de resolução NÃO são registrados como eventos de rede.

Os nomes antigos do bridge (`forge_npwd`, `qbx_npwd` e `forge-npwd-bridge`) também encaminham ao próprio telefone. Os manifests dos recursos reais declaram `provide` para dependências antigas; `provide` sozinho não encaminha exports. Não alteramos globalmente `GetResourceState`.

`compat/client.ts`, `compat/server.ts` e `compat/app.lua` adaptam solicitações de entrada aos mesmos handlers/validações atuais, sem duplicar ações de saída. Convars antigas são fallback; valores Forge explícitos têm prioridade. IDs conhecidos de apps são normalizados na leitura dos layouts, sem modificar textos pessoais ou metadata.

## NUI e limites

`compat/nui.ts` é carregado antes da interface e dos apps externos. No documento do telefone, reescreve somente hosts legados conhecidos em fetch/XHR, incluindo URLs cfx-nui; preserva método, corpo, headers, credenciais e cancelamento. Não redireciona domínios externos arbitrários.

Não intercepta NUIs independentes, iframes nem todo carregamento de script de um bundle antigo. Nesses casos, use URLs atuais. Apps desconhecidos de terceiros não são renomeados. Bundles Webpack/global antigos podem exigir rebuild ESM/Vite. Observadores de eventos internos de saída precisam usar o namespace atual.

FiveM mantém caches de exports nos consumidores pelo nome solicitado. Depois de reiniciar somente o telefone, reinicie também consumidores antigos afetados para liberar referências antigas. Não emitimos falsos eventos de parada nem prometemos que todos os bundles históricos funcionam sem teste. Prefira um RR planejado na primeira migração.

## Manutenção dos aliases

Após adicionar um alias em `compat/names.ts` ou criar um export público, regenere o catálogo e compile:

```text
node misc/generate-compat.cjs
node tests/compatibility.test.cjs
node tests/player_lifecycle.test.cjs
```

O gerador cria somente JSON dentro do telefone. Não existe instalador de proxies nem geração de resources duplicados. Os apps compartilham o helper `@forge-npwd/compat/app.lua`, que permanece dentro do telefone.

## Dados, créditos e validação

As tabelas existentes `npwd_*`, `forge_phone_*` e `player_mails`, e suas chaves de armazenamento, não foram renomeadas ou apagadas. Nenhuma migração foi aplicada ao banco ativo nesta alteração. Créditos e licenças do NPWD/Project Error foram preservados. A integração de jogador oriunda de Qbox/qbx_npwd mantém GPL-3.0-or-later nos módulos Lua; a licença correspondente está em `compat/licenses/qbx_npwd-GPL-3.0.txt`. As demais licenças existentes não foram substituídas.

Testes locais (a partir da pasta do telefone):

```text
node tests/compatibility.test.cjs
node tests/player_lifecycle.test.cjs
lua tests/compatibility_test.lua
lua tests/player_bridge_test.lua
lua tests/client_exports_test.lua
```

No jogo: testar uso do item, inventário cheio/vazio, telefone transferido, PIN, troca de personagem, reconexão, chamada/câmera, apps atuais, consumers Lua/JS antigos e reinício planejado. Mocks e compilação não substituem homologação multiplayer.
