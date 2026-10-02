- [ ] Criar aba Hermes no Websidian 📅 2026-10-02 ✅ 2026-10-02
- [x] US01-T01 - Design da página (frontend) 📅 2026-10-02 ✅ 2026-10-02
    - [x] Esboçar wireframe simples da página de terminal (área  para saída, campo de entrada ou botão de envio, espaço para áudio) 
    - [x] Definir paleta de cores e tipografia seguindo as referências de design do Websidian 
    - [x] Elaborar documento de design (HTML + CSS básico) em formato Markdown ou .html para revisão 
- [ ] US01-T02 - Criação da spec do backend com OpenSpec 📅 2026-10-02
	/opsx-propose hermes-terminal-backend 
	Crie um serviço que roda uma instancia de terminal com hermes agent, expondo endpoints para dar input de texto ou áudio, e que faça output do texto do terminal em um metodo Get que aceite polling do frontend.
	O serviço de backend deve utilizar do hermes agente para criar arquivos de audio via TTS da resposta e enviar este áudio junto com a resposta de texto da IA apenas, não gerar áudios da mensagem de humanos.
	O serviço deve salvar áudios como arquivo temporário e gerenciar os arquivos de audio temporários com limite das 10 ultimas mensagens.
	O endpoint get Terminal deve retornar um html estático com todas as informações, apenas o ultimo botão de áudio deve conter autoplay
    - [ ] Listar endpoints necessários: GET /terminal/poll?since=ts, POST /terminal/input Get/Audio/id
		    - Get/terminal json response schema: ```
		      ```
		      ```{ "since": 1730522400000, // timestamp para o próximo poll "html": "<div class=\"mb-6\">…</div><div class=\"mb-6\">…</div>", // concatenação de um ou mais blocos acima "audio": [ // lista de áudios referentes às novas linhas de IA neste lote { "id": "a1b2c3d4", "url": "/audio/a1b2c3d4.mp3", "text": "Síntese Vocal Agêntica" } // … mais se houver várias respostas neste lote ] }```
	
	
		    - Get/terminal HTML components structure:  ```<!-- ==== MESSAGE BLOCK (server‑side rendered) ==== --> <div class="mb-6"> {/* Header – agent name & timestamp */} <div class="flex items-center gap-2 text-label-sm font-label-sm"> <div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(208,188,255,0.8)]"></div> <span class="font-code-md text-code-md font-semibold text-primary">{{AGENT_NAME}}</span> <span class="text-outline">•</span> <span class="px-1.5 py-0.2 rounded bg-surface-container-high text-primary border border-outline-variant/30 font-code-md">{{ELAPSED_TIME}}</span> </div> {/* Body – ANSI‑converted text (already HTML‑escaped) */} <div class="bg-surface-container-lowest/70 border-l-2 border-primary border-t border-r border-b border-outline-variant/30 rounded-r-lg rounded-bl-lg p-4 sm:p-5 space-y-4"> <p class="text-on-surface font-body-md leading-relaxed"> {{MESSAGE_TEXT}} </p> {/* Optional CLI snippet (can be omitted if not needed) */} <div class="rounded-md bg-surface-container-lowest border border-outline-variant/40 overflow-hidden font-code-md text-code-md mt-3"> <div class="bg-surface-container-high/40 px-3 py-1.5 border-b border-outline-variant/30 flex items-center justify-between text-label-sm text-outline"> <span class="text-on-surface-variant font-code-md">{{COMMAND_LINE}}</span> <span class="text-primary font-medium">{{EXIT_CODE}}</span> </div> <div class="p-3 space-y-1 text-on-surface-variant leading-5 text-sm"> <p class="text-outline">{{LOG_LINE_1}}</p> <p><span class="text-secondary">[STREAM]</span> {{LOG_LINE_2}}</p> <p><span class="text-primary">[BENCH]</span> {{LOG_LINE_3}}</p> <p><span class="text-tertiary">[BUFFER]</span> {{LOG_LINE_4}}</p> <p class="text-primary font-semibold pt-1">{{LOG_LINE_5}}</p> </div> </div> {/* Audio player – only the LAST block gets autoplay */} <div class="bg-surface-container-high/30 border border-outline-variant/30 rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-3"> {/* Play button */} <div class="flex items-center gap-3"> <button class="w-8 h-8 rounded-full bg-primary text-on-primary-container flex items-center justify-center hover:bg-surface-tint active:scale-95 transition-all shadow-[0_0_10px_rgba(208,188,255,0.35)] flex-shrink-0" title="Reproduzir Síntese Vocal"> <span class="material-symbols-outlined text-[18px]" data-icon="play_arrow">play_arrow</span> </button> {/* Audio info */} <div class="flex flex-col"> <span class="font-code-md text-code-md text-primary font-medium text-xs sm:text-sm">Síntese Vocal Agêntica</span> <span class="font-label-sm text-label-sm text-outline text-[11px]">{{AUDIO_DURATION}} • Hermes Neural Voxtral</span> </div> </div> {/* Waveform indicator (simple visual) */} <div class="flex items-center gap-1 h-5 px-2 bg-surface-container-lowest/60 rounded border border-outline-variant/20"> <span class="w-1 bg-primary/40 h-2 rounded-full"></span> <span class="w-1 bg-primary/70 h-3.5 rounded-full"></span> <span class="w-1 bg-primary h-4 rounded-full"></span> <span class="w-1 bg-primary h-2.5 rounded-full"></span> <span class="w-1 bg-primary h-4.5 rounded-full"></span> <span class="w-1 bg-primary/60 h-3 rounded-full"></span> <span class="w-1 bg-outline-variant h-2 rounded-full"></span> <span class="w-1 bg-outline-variant h-3.5 rounded-full"></span> <span class="w-1 bg-outline-variant h-1.5 rounded-full"></span> </div> </div> </div> </div>
		    ```
    - [x] Definir esquemas de request/response (JSON) para cada endpoint – response incluirá campo html (string) contendo o trecho pronto para inserir no DOM 
    - [ ] Escrever arquivo OpenSpec (YAML/JSON) contendo: paths, parameters, responses, exemplos de payload
    - [ ] Incluir tratamento de erro (500, 400) e cabeçalhos de CORS (se necessário)
- [ ] US01-T03 - Implementação do backend 📅 2026-10-02
    - [ ] Criar servidor Node.js/Express mínimo (ou usar módulo http puro)
    - [ ] Adicionar dependência ansi-up (ou similar) para converter códigos ANSI em HTML
    - [ ] Implementar spawn do processo Hermes em PTY (child_process.spawn)
    - [ ] Ler continuamente a saída do PTY e armazenar em buffer linear com timestamp
    - [ ] Detectar linhas de resposta da IA (heurística: prompt do Hermes ou padrão específico)
    - [ ] Para cada linha de IA, chamar a ferramenta de TTS do Hermes (text_to_speech) e salvar o arquivo MP3 em diretório temporário (máx 10 arquivos, LRU)
    - [ ] Converter todo o output bruto (incluindo sequências ANSI) para HTML usando ansi-up antes de enviar ao cliente
    - [ ] Implementar endpoint /terminal/poll que retorna JSON: { since, html, audio: [{url, text}] }
    - [ ] Implementar endpoint /terminal/input (POST) que escreve no stdin do processo Hermes
    - [ ] Adicionar lógica de respawn do processo Hermes caso ele termine inesperadamente
    - [ ] Limpar arquivos de áudio antigos (mais de 10 min ou quando >10)
- [ ] US01-T04 - Teste de backend no Swagger (ou equivalente) 📅 2026-10-02
    - [ ] Iniciar o servidor localmente e apontar a UI do Swagger para o arquivo OpenSpec
    - [ ] Verificar que ambos os endpoints aparecem e são executáveis
    - [ ] Testar /terminal/poll com since=0 → receber html contendo cores/estilos e (eventualmente) áudio
    - [ ] Testar /terminal/input enviando um comando simples (ex.: echo ola) e confirmar que a saída HTML aparece na próxima chamada de poll
    - [ ] Verificar que arquivos de áudio são gerados e removidos conforme a política de retenção
    - [ ] Validar que o HTML inserido em um <div> renderiza exatamente como o Hermes no CLI (cores, negrito, etc.)
- [ ] US01-T05 - Criação da spec do frontend 📅 2026-10-02
    - [ ] Definir contrato de comunicação:
        GET /terminal/poll?since=<ts> → {since, html:string, audio:[{url,text}]}
        POST /terminal/input → {data: string}
    - [ ] Especificar comportamento de polling (intervalo ≈ 1s, tratamento de 404/500, backoff exponencial opcional)
    - [ ] Descrever como inserir o html retornado no container (ex.: terminalDiv.insertAdjacentHTML('beforeend', resp.html)) e rolar para baixo
    - [ ] Descrição de como renderizar cada item de audio (ex.: criar <audio src=\"url\" controls autoplay> e inseri‑lo imediatamente após o trecho de HTML correspondente ou colocar em uma fila de reprodução)
    - [ ] Listar requisitos de compatibilidade (Android 4 WebKit, somente XMLHttpRequest, sem WebSocket/EventSource)
- [ ] US01-T06 - Implementação do frontend 📅 2026-10-02
    - [ ] Criar página HTML mínima com:
        <div id=\"terminal\" style=\"white-space:pre-wrap; font-family:monospace;\"></div>
        <input id=\"cmd\" type=\"text\" placeholder=\"Digite o comando…\"> + botão Enviar (ou captura de Enter)
    - [ ] Implementar função poll() usando XMLHttpRequest que:
        Lê since armazenado em variável global ou localStorage
        Faz GET ao endpoint /terminal/poll
        Atualiza since com o valor retornado
        Insere resp.html no <div id=\"terminal\"> via insertAdjacentHTML('beforeend', resp.html)
        Rolagem automática para o bottom (terminal.scrollTop = terminal.scrollHeight)
        Para cada objeto em resp.audio, cria elemento <audio src=\"url\" controls autoplay> e o anexa após o último caractere inserido (ou adiciona a uma fila de reprodução)
    - [ ] Implementar envio de comando: ao clicar em Enviar ou pressionar Enter, fazer POST a /terminal/input com {data: texto + \"\\n\"}
    - [ ] Adicionar tratamento de erros de rede (tentar novamente após 2s, exibir mensagem de aviso)
    - [ ] Testar a página em um emulador ou dispositivo Android 4 (ou navegador que simule aquele nível de suporte)
    - [ ] Verificar que o texto aparece com as mesmas cores/estilos do Hermes CLI e que o áudio é reproduzido automaticamente
    - [ ] Verificar que não há vazamento de memória (limpar elementos de áudio muito antigos se necessario)