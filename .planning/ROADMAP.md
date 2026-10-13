# Roadmap do Forge Phone

### Phase 1: Identidade unica do aparelho

Criar tabelas de perfil, aparelho e linha; provisionar o item pelo `pr_bridge`; ativar o numero por aparelho; manter espelho legado controlado; preparar bloqueio e substituicao.

Requisitos: DEV-01..06, LINE-01..04, SEC-01..03, REC-01..02, COMP-01..03.

### Phase 2: Area de trabalho real

Implementar 1 a 5 paginas, navegacao horizontal, grade de icones, toque longo, arraste, encaixe e persistencia por perfil do aparelho.

Requisitos: HOME-01..05.

### Phase 3: Bloqueio, PIN e sessoes

Adicionar cadastro e troca de PIN, hash forte com salt no servidor, tentativas limitadas, sessoes revogaveis e tela de bloqueio.

### Phase 4: Recuperacao e transferencia

Criar fluxo administrativo/jogavel para declarar perda, bloquear aparelho antigo, emitir substituto e transferir perfil, linha, configuracoes e aplicativos.

### Phase 5: Migracao completa e identidade Forge Phone

Migrar dados dos aplicativos para o perfil do aparelho, adaptar consumidores externos, retirar gradualmente a dependencia de `players.phone_number` e concluir a identidade visual/tecnica Forge Phone.

