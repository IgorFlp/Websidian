# Tasks

## 1. Pesquisa API Beszel (Context7)

- [ ] 1.1 Usar MCP Context7 para buscar documentação da API Beszel (endpoints, formatos de resposta, autenticação) e salvar achados em arquivo temporário. Verificação: arquivo com endpoints/documentação criado.

## 2. Estrutura base HTML

- [ ] 2.1 Criar `public/server-monitor.html` com doctype, html, head, body, meta viewport, charset UTF-8. Verificação: arquivo abre no navegador sem erros.
- [ ] 2.2 Criar `public/server-monitor.css` com reset básico, variáveis de cor (root), tipografia. Verificação: estilos aplicados visualmente.
- [ ] 2.3 Criar `public/server-monitor.js` vazio com variável `BESZEL_API_BASE`. Verificação: arquivo carrega sem erros.
- [ ] 2.4 Adicionar `<link rel="stylesheet" href="server-monitor.css">` no `<head>` e `<script src="server-monitor.js"></script>` antes de fechar `</body>`. Verificação: CSS e JS carregam no HTML.
- [ ] 2.5 Adicionar estrutura HTML semântica no `<body>`: header, main com 4 cards (CPU, Memória, Disco, Rede), footer. Verificação: estrutura DOM corresponde ao design de referência.

## 3. CSS fiel ao design Google Stitch

- [ ] 3.1 Implementar layout dos cards (grid/flex) responsivo. Verificação: cards organizados como no screenshot.
- [ ] 3.2 Estilizar indicadores de métricas: barras de progresso, porcentagens, valores numéricos. Verificação: visual idêntico ao design.
- [ ] 3.3 Adicionar fallbacks CSS para Android 4 (inline-block, table-cell, evitar calc/var/grid). Verificação: página renderiza em emulador Android 4.
- [ ] 3.4 Adicionar `@media (prefers-reduced-motion)` para desabilitar animações no Playwright. Verificação: animações desativadas em teste.

## 4. JavaScript ES5 (compatível Android 4) - em `public/server-monitor.js`

- [ ] 4.1 Definir variável de configuração `BESZEL_API_BASE` no topo do script. Verificação: variável acessível.
- [ ] 4.2 Implementar função `xhrGet(url, callback)` usando `XMLHttpRequest` com tratamento de erro. Verificação: requisição funciona em navegador antigo.
- [ ] 4.3 Implementar `parseMetrics(responseText)` para extrair CPU, memória, disco, rede do JSON da API. Verificação: parsing correto com dados de exemplo.
- [ ] 4.4 Implementar `updateUI(metrics)` para atualizar DOM com novos valores. Verificação: valores aparecem nos cards.
- [ ] 4.5 Implementar `startPolling(intervalMs)` com `setInterval` chamando XHR e updateUI. Verificação: polling ocorre a cada 1s no console/network tab.
- [ ] 4.6 Adicionar tratamento de erro silencioso + retry no próximo intervalo. Verificação: erros de rede não quebram a página.
- [ ] 4.7 Adicionar `DOMContentLoaded` listener para iniciar polling automaticamente. Verificação: polling inicia ao carregar página.

## 5. Integração e testes manuais

- [ ] 5.1 Abrir `public/server-monitor.html` no navegador moderno e verificar funcionamento completo. Verificação: métricas carregam e atualizam a cada 1s.
- [ ] 5.2 Testar em emulador Android 4 (ou Chrome DevTools device toolbar com user agent antigo). Verificação: sem erros JS, layout funcional.

## 6. Validação visual automatizada (Playwright)

- [ ] 6.1 Criar script Playwright `test/visual-monitor.cjs` que abre a página, espera networkidle, tira screenshot. Verificação: script roda sem erros.
- [ ] 6.2 Comparar screenshot com `@docs/design-reference/monitor-page/screen.png` usando pixelmatch (threshold 0.1%). Verificação: diferença dentro do threshold.
- [ ] 6.3 Ajustar CSS/HTML até passar validação visual. Verificação: teste Playwright passa.

## 7. Documentação final

- [ ] 7.1 Adicionar comentário no topo do HTML com URL da API, instruções de deploy. Verificação: documentação presente no arquivo.

## Workflow follow-up

- Archive the change after implementation is complete and validated.
- Verify the archived result.