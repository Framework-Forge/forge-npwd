# Requisitos do Forge Phone

## Identidade e persistencia

- **DEV-01** Cada item `phone` deve possuir um `deviceId` UUID exclusivo e um `serialNumber` exclusivo.
- **DEV-02** O primeiro uso de um item ainda nao provisionado deve criar seu aparelho de forma idempotente.
- **DEV-03** O aparelho deve registrar apenas o `registered_owner_citizenid` da primeira ativacao.
- **DEV-04** A posse atual deve continuar sendo determinada pelo inventario, sem coluna de portador atual.
- **DEV-05** Um aparelho deve possuir estado controlado (`active`, `blocked`, `replaced`).
- **DEV-06** Metadata do item deve conter somente referencias e dados publicos necessarios ao inventario.

## Numero e perfil

- **LINE-01** Numeros devem ser unicos e armazenados fora da tabela `players`.
- **LINE-02** Um personagem pode registrar varios aparelhos e varios numeros.
- **LINE-03** Um perfil recuperavel deve sobreviver a substituicao do aparelho fisico.
- **LINE-04** Durante a transicao, o numero do aparelho ativo deve ser projetado em `players.phone_number` apenas para compatibilidade.

## Seguranca e recuperacao

- **SEC-01** Senha, PIN ou hash nunca deve ser gravado no metadata do item.
- **SEC-02** Aparelhos bloqueados nao podem ser ativados nem abrir a interface.
- **SEC-03** Operacoes de provisionamento devem validar o item e o slot no servidor.
- **REC-01** A estrutura deve permitir bloquear o aparelho antigo e vincular um novo aparelho ao mesmo perfil e numero.
- **REC-02** A substituicao deve preservar o proprietario registrado original.

## Area de trabalho futura

- **HOME-01** O usuario podera configurar de 1 a 5 paginas de area de trabalho; o padrao e 1.
- **HOME-02** Cada pagina usara o mesmo wallpaper e navegacao horizontal por gesto.
- **HOME-03** Icones poderao ser movidos por toque longo e arraste em uma grade com espacos vazios.
- **HOME-04** Cada aplicativo podera ocupar apenas uma posicao em todas as paginas.
- **HOME-05** Paginas novas comecarao vazias.

## Compatibilidade

- **COMP-01** O recurso `npwd` existente nao sera alterado nesta fase.
- **COMP-02** Contratos `npwd:*` permanecem enquanto consumidores externos forem migrados.
- **COMP-03** O Forge Phone acessara metadata por `pr_bridge`, nao diretamente por um inventario especifico.

## Definition of Done da fase 1

- SQL de instalacao contem tabelas, indices e restricoes da nova fundacao.
- O primeiro uso grava metadata e registros autoritativos.
- O segundo uso recupera os mesmos registros.
- Aparelho bloqueado e recusado.
- O numero ativo e carregado na sessao e espelhado temporariamente no jogador.
- Build do backend e verificacoes automatizadas passam.

