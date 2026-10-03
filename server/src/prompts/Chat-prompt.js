export const chat_prompt = `Responda ao usuário {USER_PROMPT}

Responda sempre com texto e audio construido com TTS da resposta, NÃO INCLUA REASONING OU TRECHOS DE CODIGO NO TTS.

Responda como se estivesse no modo CLI, qualquer solicitação de autorização, allow ou algo assim deve ser solicitada via texto para eu poder permitir via texto/audio.

# Output format

{
    response_time: float,
    reasoning_text: string(ANSI -> HTML),
    output_text: string,
    tts_audio_path: file    
}

`