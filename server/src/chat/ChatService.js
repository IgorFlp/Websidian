import { getHermesClient } from "../hermes/HermesClient.js";

const AUDIO_INSTRUCTION = "Responda em texto e em audio e me retorne o caminho do audio temp";

function parseHermesResponse(response) {
  if (!response) {
    return { text: "", audioPath: null };
  }

  if (typeof response === "string") {
    return { text: response, audioPath: null };
  }

  if (typeof response === "object") {
    if (response.text && response.audioPath) {
      return { text: response.text, audioPath: response.audioPath };
    }
    if (response.content && response.audioPath) {
      return { text: response.content, audioPath: response.audioPath };
    }
    if (response.message && response.audioPath) {
      return { text: response.message, audioPath: response.audioPath };
    }
    if (response.choices && response.choices[0]) {
      const choice = response.choices[0];
      if (choice.message && choice.message.content) {
        const content = choice.message.content;
        if (typeof content === "string") {
          const audioPathMatch = content.match(/audioPath[:\s]+([^\s]+)/i);
          const audioPath = audioPathMatch ? audioPathMatch[1] : null;
          const text = content.replace(/audioPath[:\s]+[^\s]+/i, "").trim();
          return { text, audioPath };
        }
      }
    }
    if (response.audioPath) {
      const text = response.text || response.content || response.message || "";
      return { text, audioPath: response.audioPath };
    }
  }

  return { text: JSON.stringify(response), audioPath: null };
}

export class ChatService {
  constructor(audioFileManager, htmlRenderer) {
    this.audioFileManager = audioFileManager;
    this.htmlRenderer = htmlRenderer;
    this.hermesClient = getHermesClient();
  }

  async processChat(input, sessionId = null) {
    if (!input || typeof input !== "string") {
      throw new Error("Input is required and must be a string");
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const sessions = await this.hermesClient.getSessions({ limit: 1 });
      if (sessions && sessions.data && sessions.data.length > 0) {
        currentSessionId = sessions.data[0].id;
      } else if (sessions && sessions.length > 0) {
        currentSessionId = sessions[0].id;
      } else {
        throw new Error("No existing sessions found. Create one via Hermes dashboard first.");
      }
    }

    const combinedInput = `${input}\n\n${AUDIO_INSTRUCTION}`;

    let hermesResponse;
    try {
      hermesResponse = await this.hermesClient.chat(currentSessionId, combinedInput);
    } catch (err) {
      if (err.status === 404) {
        throw { status: 404, message: "Session not found" };
      }
      throw { status: 500, message: `Hermes API error: ${err.message}` };
    }

    const { text, audioPath } = parseHermesResponse(hermesResponse);

    let audioArray = [];
    if (audioPath) {
      try {
        const audioFile = await this.audioFileManager.addFromHermesTemp(audioPath, text);
        audioArray = [{
          id: audioFile.id,
          url: `/audio/${audioFile.id}`,
          text: audioFile.text,
          duration: audioFile.duration,
        }];
      } catch (err) {
        console.error("Failed to process audio file:", err.message);
      }
    }

    const isAI = true;
    const html = this.htmlRenderer.renderChatMessage({
      id: `msg-${Date.now()}`,
      isAI,
      text,
      timestamp: Date.now(),
      audio: audioArray.length > 0 ? audioArray[0] : null,
      isLastAI: true,
    });

    return {
      sessionId: currentSessionId,
      html,
      audio: audioArray,
    };
  }
}

export default ChatService;