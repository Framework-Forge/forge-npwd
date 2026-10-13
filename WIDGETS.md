# Widgets da area de trabalho

Aplicativos internos ou federados podem publicar modelos de widget pela propriedade `homeWidgets` da configuracao do app.

```tsx
export default () => ({
  id: 'meu_app',
  path: '/meu-app',
  // restante da configuracao do aplicativo
  homeWidgets: [
    {
      id: 'resumo',
      name: 'Resumo',
      description: 'Informacoes atualizadas do aplicativo.',
      sizes: [
        { width: 2, height: 1, label: 'Compacto 2x1' },
        { width: 4, height: 2, label: 'Grande 4x2' },
      ],
      Component: MeuWidget,
      path: '/meu-app',
    },
  ],
});
```

O componente recebe `width` e `height`. Cada pagina possui quatro colunas e cinco linhas. O Forge NPWD cuida da selecao de tamanho, posicionamento, arraste, remocao e persistencia por perfil.

IDs persistidos de aplicativos externos seguem o formato `<appId>:<widgetId>`. O aplicativo pode atualizar o componente por callback NUI, mensagens do Forge NPWD ou estado React proprio.

