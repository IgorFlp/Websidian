# Design

## Context

- Proposta: Ver `proposal.md` - Why e What Changes
- Specs: Ver `specs/server-monitor/spec.md` - Requirements detalhados
- Referência de design: `@docs/design-reference/monitor-page/screen.png` (Google Stitch)
- API: Beszel (auto-hospedada) - endpoints e formatos via Context7
- Arquivos de saída: `public/server-monitor.html`, `public/server-monitor.css`, `public/server-monitor.js`

## Goals / Non-Goals

**Goals:**
- Página HTML com CSS e JS em arquivos separados (`server-monitor.html`, `server-monitor.css`, `server-monitor.js`)
- Sem dependências externas CDN
- Polling via `setInterval` + `XMLHttpRequest` (compatível ES5/Android 4)
- Layout responsivo fiel ao design de referência
- Validação visual automatizada com Playwright

**Non-Goals:**
- Backend/API próprio (usa Beszel existente)
- Autenticação na página (assume API acessível)
- Histórico de métricas / gráficos temporais
- Configuração de intervalo de polling (fixo em 1s)

## Decisions

### 1. Arquitetura: HTML + CSS + JS em arquivos separados
**Racional**: Organização limpa, cacheável pelo navegador, ainda compatível com Android 4 via `<link rel="stylesheet">` e `<script src="">` (sem módulos ES6).
**Alternativas**: 
- Tudo inline no HTML → funcional mas difícil de manter
- Framework (React/Vue) → incompatível com Android 4, build necessário

### 2. HTTP Client: `XMLHttpRequest` (não `fetch`)
**Racional**: `fetch` não existe em Android 4 / IE11. `XMLHttpRequest` é universal.
**Polyfill**: Não - adiciona complexidade. XHR nativo basta.

### 3. Polling: `setInterval` com XHR síncrono não-bloqueante
**Racional**: Simples, compatível, previsível. `setTimeout` recursivo seria alternativa mas `setInterval` é mais direto para intervalo fixo.
**Tratamento de erro**: Silencioso + retry no próximo intervalo (evita spam de erros).

### 4. CSS: Flexbox + fallback float/inline-block
**Racional**: Flexbox suportado desde Android 4.4 / iOS 7. Para Android 4.0-4.3, usar `display: table` / `inline-block` como fallback via `@supports` ou classes condicionais.

### 5. Unidades: `rem` com fallback `px`
**Racional**: `rem` suportado antigo. Definir `font-size: 16px` no `:root` e usar `rem` para escalabilidade.

### 6. API Beszel: Endpoints via Context7
**Ação**: Usar MCP Context7 para descobrir endpoints exatos (`/api/system`, `/api/metrics`, etc.) e formato de resposta antes de implementar.

### 7. Validação Visual: Playwright pixelmatch
**Racional**: Comparar screenshot renderizado vs `@docs/design-reference/monitor-page/screen.png` com threshold de 0.1% diferença.

## Risks / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| API Beszel muda formato | Versionar endpoint no código; logging de resposta para debug |
| Android 4 não renderiza CSS moderno | Testar em emulador Android 4; fallbacks CSS; evitar `calc()`, `var()`, `grid` |
| Polling 1s sobrecarrega servidor | Beszel é leve; se necessário, fazer backoff exponencial em erros |
| CORS bloqueia XHR | Assumir mesma origem ou proxy; documentar necessidade de `Access-Control-Allow-Origin` |
| Screenshot Playwright flaky | Usar `waitForLoadState('networkidle')`; desabilitar animações CSS via media query |

## Migration Plan

1. Criar `public/server-monitor.html` com estrutura base + link CSS + script JS
2. Criar `public/server-monitor.css` com estilos fieis ao design
3. Criar `public/server-monitor.js` com lógica XHR + polling + DOM update
4. Testar localmente + emulador Android 4
5. Configurar Playwright test para validação visual
6. Ajustar até passar threshold visual
7. Documentar URL da API Beszel em variável de configuração no topo do JS

## Open Questions

- URL base da API Beszel (hardcode? variável de ambiente? query param?)
- Autenticação na API (token? basic auth? header customizado?)
- Métricas exatas retornadas pela API (nomes dos campos) - resolver via Context7