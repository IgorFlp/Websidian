import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AudioFileManager } from "../service/audio.service.js";
import { config } from "../config/index.js";
import fs from "fs";
import path from "path";

const audioFileManager = new AudioFileManager();

const ttsRequestSchema = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
  speed: z.number().optional().default(1),
  messageId: z.string().optional(),
});

const ttsResponseSchema = z.object({
  url: z.string(),
  text: z.string(),
  messageId: z.string().optional(),
});

const ttsCheckParamsSchema = z.object({
  messageId: z.string().min(1),
});

const sttResponseSchema = z.object({
  text: z.string(),
  segments: z.array(z.unknown()).optional(),
});

const uploadAudioResponseSchema = z.object({
  audioPath: z.string(),
  fileName: z.string(),
  size: z.number(),
  mimetype: z.string(),
  transcript: z.string(),
  segments: z.array(z.unknown()).optional(),
});

const audioParamsSchema = z.object({
  id: z.string().min(1),
});

export const audioRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post("/api/tts", {
    schema: {
      body: ttsRequestSchema,
      response: {
        200: ttsResponseSchema,
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
        502: z.object({ error: z.string() }),
        504: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const { text, voice = config.ttsVoice, language = config.ttsLanguage, speed = config.ttsSpeed || 1, messageId } = request.body as { text: string; voice?: string; language?: string; speed?: number; messageId?: string };

      const speachesUrl = config.speachesApiUrl;
      const apiKey = config.speachesApiKey;

      const payload = {
        model: config.ttsModel,
        input: text,
        voice,
        language,
        response_format: "mp3",
        speed,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 30000);

      const fullUrl = `${speachesUrl}/v1/audio/speech`;

      let response: Response;
      try {
        response = await fetch(fullUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          return reply.status(504).send({ error: "TTS request timeout" });
        }
        return reply.status(502).send({ error: "TTS service unreachable" });
      }

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return reply.status(502).send({ error: "TTS generation failed: " + response.status });
      }

      const audioBuffer = await response.arrayBuffer();
      const audioData = Buffer.from(audioBuffer);

      const PUBLIC_DIR = path.join(process.cwd(), "..", "public");
      const AUDIOS_DIR = path.join(PUBLIC_DIR, "audio");
      if (!fs.existsSync(AUDIOS_DIR)) {
        fs.mkdirSync(AUDIOS_DIR, { recursive: true });
      }

      const fileName = messageId
        ? `tts-${messageId}.mp3`
        : `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
      const filePath = path.join(AUDIOS_DIR, fileName);
      fs.writeFileSync(filePath, audioData);

      const audioUrl = `/audio/${fileName}`;

      return { url: audioUrl, text: text.slice(0, 100), messageId };
    } catch (err) {
      return reply.status(500).send({ error: "TTS generation failed" });
    }
  });

  fastify.get("/api/tts/:messageId", {
    schema: {
      params: z.object({ messageId: z.string().min(1) }),
      response: {
        200: z.object({ exists: z.boolean(), url: z.string().optional() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const { messageId } = request.params as { messageId: string };
      const PUBLIC_DIR = path.join(process.cwd(), "..", "public");
      const AUDIOS_DIR = path.join(PUBLIC_DIR, "audio");
      const fileName = `tts-${messageId}.mp3`;
      const filePath = path.join(AUDIOS_DIR, fileName);

      if (fs.existsSync(filePath)) {
        return { exists: true, url: `/audio/${fileName}` };
      }
      return { exists: false };
    } catch (err) {
      return reply.status(500).send({ error: "Failed to check TTS audio" });
    }
  });

  fastify.post("/api/stt", {
    schema: {
      consumes: ["multipart/form-data"],
      response: {
        200: z.object({ text: z.string(), segments: z.array(z.unknown()).optional() }),
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
        502: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No audio file provided" });
      }

      const speachesUrl = config.speachesApiUrl;
      const apiKey = config.speachesApiKey;
      const sttModel = config.sttModel;
      const sttLanguage = config.sttLanguage;

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);
      const blob = new Blob([audioBuffer], { type: data.mimetype || "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob, data.filename || "audio.webm");
      formData.append("model", sttModel);
      formData.append("language", sttLanguage);
      formData.append("response_format", "json");
      formData.append("temperature", "0.3");
      formData.append("vad_filter", "false");

      const response = await fetch(`${speachesUrl}/v1/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return reply.status(502).send({ error: "STT failed: " + response.status });
      }

      const result = await response.json() as { text: string; segments?: unknown[] };
      return { text: result.text, segments: result.segments || [] };
    } catch (err) {
      return reply.status(500).send({ error: "STT failed" });
    }
  });

  fastify.post("/api/upload-audio", {
    schema: {
      consumes: ["multipart/form-data"],
      response: {
        200: z.object({
          audioPath: z.string(),
          fileName: z.string(),
          size: z.number(),
          mimetype: z.string(),
          transcript: z.string(),
          segments: z.array(z.unknown()).optional(),
        }),
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
        502: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No audio file provided" });
      }

      const speachesUrl = config.speachesApiUrl;
      const apiKey = config.speachesApiKey;
      const sttModel = config.sttModel;
      const sttLanguage = config.sttLanguage;

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);
      const blob = new Blob([audioBuffer], { type: data.mimetype || "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob, data.filename || "audio.webm");
      formData.append("model", sttModel);
      formData.append("language", sttLanguage);
      formData.append("response_format", "json");
      formData.append("temperature", "0.3");
      formData.append("vad_filter", "true");

      const PUBLIC_DIR = path.join(process.cwd(), "..", "public");
      const UPLOADS_DIR = path.join(PUBLIC_DIR, "audio", "uploads");
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const fileName = data.filename || `upload-${Date.now()}.webm`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      fs.writeFileSync(filePath, audioBuffer);
      const audioPathSaved = `/audio/uploads/${fileName}`;

      const response = await fetch(`${speachesUrl}/v1/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return reply.status(502).send({ error: "STT failed: " + response.status });
      }

      const result = await response.json() as { text: string; segments?: unknown[] };

      return {
        audioPath: audioPathSaved,
        fileName: data.filename,
        size: audioBuffer.length,
        mimetype: data.mimetype,
        transcript: result.text,
        segments: result.segments || [],
      };
    } catch (err) {
      return reply.status(500).send({ error: "Server error" });
    }
  });

  fastify.get("/api/tts-config", {
    schema: {
      response: {
        200: z.object({
          url: z.string(),
          autoPlay: z.boolean(),
        }),
      },
    },
  }, async () => {
    return {
      url: config.speachesApiUrl,
      autoPlay: true,
    };
  });

  fastify.get("/audio/stream/:id", {
    schema: {
      params: z.object({ id: z.string().min(1) }),
      response: {
        200: z.string(),
        404: z.object({ error: z.string() }),
      },
      hide: true,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const audioFile = audioFileManager.get(id);

    if (!audioFile) {
      return reply.status(404).send({ error: "Audio not found" });
    }

    const filePath = audioFile.path;

    if (!fs.existsSync(filePath)) {
      audioFileManager.remove(id);
      return reply.status(404).send({ error: "Audio file not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.range;

    if (range) {
      const parts: string[] = range.replace(/bytes=/, "").split("-");
      const start = Number(parts[0]);
      const endPart = parts[1];
      const end = endPart ? Number(endPart) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });
      reply.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      reply.header("Accept-Ranges", "bytes");
      reply.header("Content-Length", chunkSize);
      reply.header("Content-Type", "audio/mpeg");
      return file;
    } else {
      reply.header("Content-Length", fileSize);
      reply.header("Content-Type", "audio/mpeg");
      reply.header("Accept-Ranges", "bytes");
      return fs.createReadStream(filePath);
    }
  });
};

export default audioRoutes;