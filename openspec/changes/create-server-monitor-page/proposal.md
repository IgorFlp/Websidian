# Proposal

## Why

Precisamos de uma página de monitoramento de servidor para visualizar métricas em tempo real (CPU, memória, disco, rede) do nosso servidor via API Beszel. Atualmente não existe interface para acompanhar esses dados.

## What Changes

- Nova página `public/server-monitor.html` com design fiel ao Google Stitch (@docs/design-reference/monitor-page)
- Consumo da API Beszel com polling a cada 1 segundo
- Compatibilidade com navegadores antigos e Android 4 (ES5, sem módulos, CSS fallback)
- Validação visual via Playwright comparando com screenshot de referência

## Capabilities

### New Capabilities
- `server-monitor`: Página de monitoramento de servidor com exibição de métricas em tempo real via API Beszel

### Modified Capabilities
- Nenhuma

## Impact

- Novo arquivo: `public/server-monitor.html` (HTML + CSS + JS inline)
- Dependência: API Beszel hospedada no servidor
- Ferramentas: Playwright para validação visual, Context7 para documentação da API Beszel