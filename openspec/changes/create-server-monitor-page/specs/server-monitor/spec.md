# Spec Delta

## Purpose

Fornece uma página de monitoramento de servidor que exibe métricas em tempo real (CPU, memória, disco, rede) consumidas da API Beszel com atualização automática a cada segundo.

## ADDED Requirements

### Requirement: Exibir métricas de CPU
O sistema DEVE exibir o uso de CPU do servidor em porcentagem com indicador visual de carga.

#### Scenario: CPU atualizada via polling
- **WHEN** página carrega e polling retorna dados de CPU
- **THEN** valor de CPU é exibido atualizado na interface

### Requirement: Exibir métricas de memória
O sistema DEVE exibir uso de memória (usado/total) em GB e porcentagem.

#### Scenario: Memória atualizada via polling
- **WHEN** página carrega e polling retorna dados de memória
- **THEN** valores de memória usado, total e porcentagem são exibidos

### Requirement: Exibir métricas de disco
O sistema DEVE exibir uso de disco (usado/total) em GB e porcentagem.

#### Scenario: Disco atualizado via polling
- **WHEN** página carrega e polling retorna dados de disco
- **THEN** valores de disco usado, total e porcentagem são exibidos

### Requirement: Exibir métricas de rede
O sistema DEVE exibir tráfego de rede (entrada/saída) em Mbps.

#### Scenario: Rede atualizada via polling
- **WHEN** página carrega e polling retorna dados de rede
- **THEN** valores de rede entrada e saída são exibidos

### Requirement: Polling automático a cada 1 segundo
O sistema DEVE buscar dados da API Beszel automaticamente a cada 1000ms.

#### Scenario: Polling contínuo
- **WHEN** página está aberta
- **THEN** requisições à API ocorrem a cada 1 segundo sem intervenção do usuário

### Requirement: Compatibilidade com navegadores antigos e Android 4
O sistema DEVE funcionar em navegadores sem suporte a ES6+ (sem modules, arrow functions, const/let, fetch, Promise).

#### Scenario: Carregamento em Android 4
- **WHEN** página é aberta em Android 4 / navegador antigo
- **THEN** página carrega sem erros JavaScript e exibe métricas

### Requirement: Design fiel à referência Google Stitch
O sistema DEVE replicar visualmente o design em @docs/design-reference/monitor-page/screen.png.

#### Scenario: Validação visual via Playwright
- **WHEN** página é aberta no Playwright e comparada com screenshot de referência
- **THEN** diferenças visuais estão dentro de tolerância aceitável