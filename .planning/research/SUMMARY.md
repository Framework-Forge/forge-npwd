# Pesquisa tecnica resumida

## Estado encontrado

O NPWD atual associa a sessao diretamente ao `citizenid` e recebe `charinfo.phone` do Qbox. Consultas offline leem `players.phone_number`. Isso impede dois aparelhos independentes para o mesmo personagem.

O `pr_bridge` ja normaliza `RegisterUsableItem`, `GetItemBySlot` e `SetMetadata`, incluindo o inventario OX. A integracao deve usar essa fronteira para evitar acoplamento a um inventario especifico.

## Arquitetura escolhida

- **Perfil recuperavel:** ancora configuracoes e, futuramente, dados dos aplicativos.
- **Aparelho fisico:** identidade imutavel, serial, proprietario registrado e estado de bloqueio.
- **Linha:** numero unico vinculado ao perfil, transferivel em uma substituicao.
- **Metadata:** cache publico que referencia o aparelho; o banco continua autoritativo.
- **Sessao:** ao usar um item, o numero daquele aparelho se torna o numero ativo do jogador conectado.

## Riscos tratados

- Duplicacao por duplo uso: trava por slot no adaptador e provisionamento idempotente por `deviceId`.
- Metadata forjado: validacao server-side e banco autoritativo.
- Falha entre metadata e banco: IDs gerados sao reaproveitaveis para concluir o provisionamento.
- Dependencias legadas: espelho temporario, sem transformar a coluna antiga em JSON.
- Vazamento de credencial: nenhum segredo e persistido no item.

