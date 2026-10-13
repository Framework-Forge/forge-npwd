# Phase 3 UI Specification: Bloqueio, PIN e sessoes

## Intent

Proteger cada aparelho Forge Phone com uma senha numerica definida no primeiro uso. A tela de bloqueio deve parecer parte do sistema operacional, impedir acesso visual aos aplicativos e oferecer recuperacao clara para erros temporarios sem revelar dados sensiveis.

## Existing Design System

- Reutilizar React, Tailwind, MUI, KeyOS e icones Lucide ja presentes.
- Manter a moldura, wallpaper, barra de status e escala configurada do telefone.
- Nenhuma biblioteca visual ou de formulario adicional.
- Texto principal branco sobre fundo `neutral-950/95`; superficies secundarias `white/10` e `white/20`.

## Surfaces

### Global security gate

- Overlay absoluto cobrindo toda a `PhoneScreen`, incluindo aplicativos e navegacao inferior.
- `z-index` superior a notificacoes, navegacao e modais comuns.
- Fundo escuro com `backdrop-blur-xl` para ocultar informacoes do aparelho.
- Icone circular de 64 px, titulo, explicacao, indicadores mascarados e teclado numerico.
- PIN aceito: somente numeros, minimo 4 e maximo 6 digitos.
- Ultima linha do teclado: apagar a esquerda, zero ao centro e confirmar a direita durante cadastro/confirmacao.

### First-use setup

- Titulo inicial: `Crie uma senha`.
- Texto: `Use de 4 a 6 numeros. Esta senha ficara protegida no servidor.`
- Primeiro envio avanca para confirmacao sem persistir ainda.
- Confirmacao divergente limpa ambos os passos e exibe erro.
- Confirmacao correta cria o hash no servidor, abre a sessao e remove o overlay.

### Existing-device unlock

- Titulo: `Aparelho bloqueado`.
- O PIN nunca aparece em texto; somente pontos preenchidos.
- Ao atingir o tamanho cadastrado do PIN, a validacao ocorre automaticamente, sem botao de desbloqueio.
- Erro informa tentativas restantes sem revelar qualquer parte da senha.
- Cinco falhas bloqueiam novas tentativas por cinco minutos.
- Durante bloqueio, teclado e botao ficam indisponiveis e um contador `m:ss` e exibido.

### Change PIN in Settings

- Linha `Alterar senha do aparelho` na categoria Telefone, com icone `LockKeyhole`.
- Modal solicita senha atual, nova senha e confirmacao.
- Campos numericos mascarados, limitados a 6 caracteres.
- Sucesso fecha o modal e mostra snackbar.
- Senha atual incorreta e bloqueio temporario possuem mensagens distintas.

## Interaction Contract

- Ao fechar o telefone, a sessao visual e revogada; a proxima abertura exige PIN.
- Ao trocar o item ativo, a sessao anterior e revogada antes de abrir o novo aparelho.
- Ao bloquear ou substituir o dispositivo, todas as sessoes daquele `device_id` sao revogadas.
- Teclas possuem alvo minimo de 56 px; indicadores e botoes devem funcionar com mouse e toque NUI.
- O botao principal permanece desabilitado ate existir pelo menos 4 digitos.

## Security and Data Contract

- PIN puro existe somente durante a requisicao de configuracao/verificacao/troca.
- Metadata do item nunca recebe PIN, salt ou hash.
- Banco armazena apenas `pin_hash`, `pin_salt`, contagem de falhas, bloqueio e data de alteracao.
- Hash calculado no servidor com `scrypt`, salt aleatorio por aparelho e comparacao em tempo constante.
- Estado de sessao permanece apenas na memoria do servidor, vinculado a `source` e `device_id`.

## States and Copy

| State | Title | Supporting copy/action |
|---|---|---|
| Loading | Validando aparelho | Carregando as informacoes de seguranca... |
| Setup | Crie uma senha | Use de 4 a 6 numeros. |
| Confirm | Confirme sua senha | Digite novamente para confirmar. |
| Locked | Aparelho bloqueado | Digite sua senha para acessar o Forge Phone. |
| Wrong PIN | Aparelho bloqueado | Senha incorreta. N tentativa(s) restante(s). |
| Rate limited | Aparelho bloqueado | Tente novamente em m:ss. |
| Change success | Configuracoes | Senha do aparelho alterada. |

## Failure Handling

- Falha ao consultar seguranca mantem o overlay fechado sobre os aplicativos.
- Timeout ou erro de servidor nunca libera a interface.
- Falha ao salvar uma nova senha mantem o usuario no fluxo e permite tentar novamente.
- Reinicio do recurso elimina todas as sessoes em memoria e exige novo desbloqueio.

## Acceptance Criteria

- Aparelho sem PIN exige criacao e confirmacao antes de mostrar a home.
- Aparelho com PIN exige desbloqueio em cada nova abertura.
- PIN incorreto nao abre o telefone e reduz tentativas.
- Cinco erros ativam bloqueio persistido de cinco minutos.
- Configuracoes permite trocar o PIN apenas informando o PIN atual.
- Dois aparelhos do mesmo personagem possuem PIN e sessao independentes.
- Build de interface e build game completam sem erro.

## UI Considerations

- Form state: campos mascarados, validacao de comprimento, confirmacao e loading definidos explicitamente.
- Error state: erros de consulta falham fechados; PIN incorreto e rate limit usam copias diferentes.
- Sensitive state: overlay cobre aplicativos, notificacoes e navegacao; nenhum segredo aparece em texto ou metadata.
- Responsive state: teclado usa grade de tres colunas e largura maxima de 250 px dentro da tela existente.
- Accessibility state: botoes numericos possuem texto visivel, alvos de 56 px e estados disabled perceptiveis.
