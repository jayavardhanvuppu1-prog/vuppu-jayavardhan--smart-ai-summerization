import "dotenv/config";
import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_ID = "gemini-4-hydrogen";
const MAX_NOTES_CHARS = 60000;
const MAX_PDF_BASE64_CHARS = 18 * 1024 * 1024; // ~13.5MB binary PDF

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    const err = new Error(
      "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets."
    ) as Error & { statusCode?: number };
    err.statusCode = 500;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function normalizeNotesInput(raw: unknown): string {
  if (typeof raw !== "string") {
    throw createHttpError(400, "Study notes must be provided as text.");
  }
  const trimmed = raw.trim();
  if (trimmed.length < 30) {
    throw createHttpError(
      400,
      "Please provide at least 30 characters of study notes so the AI has enough context."
    );
  }
  if (trimmed.length > MAX_NOTES_CHARS) {
    return trimmed.slice(0, MAX_NOTES_CHARS);
  }
  return trimmed;
}

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

function handleApiError(res: Response, error: unknown, fallbackMessage: string): void {
  const errObj = error as { statusCode?: number; status?: number; message?: string };
  const rawMessage = errObj?.message || fallbackMessage;
  const status = errObj?.statusCode || errObj?.status;

  if (errObj?.statusCode && errObj.statusCode >= 400 && errObj.statusCode < 500) {
    res.status(errObj.statusCode).json({ error: rawMessage });
    return;
  }

  const lower = rawMessage.toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("permission_denied") ||
    lower.includes("not configured")
  ) {
    res.status(status === 403 ? 403 : 401).json({
      error:
        "Gemini API key is missing or invalid. Please check GEMINI_API_KEY in the Settings > Secrets panel.",
    });
    return;
  }

  if (status === 429 || lower.includes("resource_exhausted") || lower.includes("429")) {
    res.status(429).json({
      error: "AI service rate limit reached. Please wait a few seconds and try again.",
    });
    return;
  }

  if (status === 404 || lower.includes("not_found")) {
    res.status(502).json({
      error: "Configured Gemini model is unavailable. Please verify model configuration.",
    });
    return;
  }

  if (
    status === 503 ||
    lower.includes("503") ||
    lower.includes("unavailable") ||
    lower.includes("high demand")
  ) {
    res.status(503).json({
      error: "The Gemini AI service is temporarily experiencing high demand. Please try again in a moment.",
    });
    return;
  }

  console.error("[Smart Study AI Server Error]:", status, rawMessage);
  res.status(500).json({ error: fallbackMessage });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const errObj = err as { status?: number; statusCode?: number; message?: string };
      const msg = String(errObj?.message || "").toLowerCase();
      const status = errObj?.status || errObj?.statusCode;
      const isTransient =
        status === 503 ||
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("timeout");
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }
  throw lastError;
}

function parseJsonSafe<T>(rawText: string | undefined, fallbackErr: string): T {
  const cleaned = (rawText ?? "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (!cleaned) {
    throw createHttpError(502, fallbackErr);
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw createHttpError(502, fallbackErr);
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "smart-study-ai" });
  });

  // Extract readable study notes from an uploaded PDF file
  app.post("/api/notes/extract-pdf", async (req: Request, res: Response) => {
    try {
      const { base64Data, fileName } = req.body ?? {};
      if (typeof base64Data !== "string" || base64Data.length === 0) {
        throw createHttpError(400, "PDF file data is missing.");
      }
      if (base64Data.length > MAX_PDF_BASE64_CHARS) {
        throw createHttpError(400, "PDF file is too large. Please upload a PDF under 12 MB.");
      }
      const cleanName = typeof fileName === "string" && fileName.trim() ? path.basename(fileName.trim()) : "uploaded.pdf";

      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data,
                },
              },
              {
                text: "Extract all readable study content, headings, bullet points, definitions, and key formulas from this PDF document into clean, well-structured plain text notes. Preserve accuracy and do not add outside information or commentary.",
              },
            ],
          },
        })
      );

      const extractedText = (response.text ?? "").trim();
      if (!extractedText) {
        throw createHttpError(
          422,
          "Could not extract readable text from this PDF. Please try another PDF or paste your notes manually."
        );
      }

      res.json({ text: extractedText, fileName: cleanName });
    } catch (error) {
      handleApiError(res, error, "Failed to extract text from the uploaded PDF.");
    }
  });

  // Generate structured plain-English summary from study notes
  app.post("/api/study/summarize", async (req: Request, res: Response) => {
    try {
      const notes = normalizeNotesInput(req.body?.notes);
      const rawDepth = req.body?.depth;
      const depth: "standard" | "simple" | "exam" =
        rawDepth === "simple" || rawDepth === "exam" ? rawDepth : "standard";

      const depthGuidance =
        depth === "simple"
          ? "Explain everything in ultra-clear, beginner-friendly English using everyday analogies so anyone can grasp difficult topics quickly."
          : depth === "exam"
            ? "Focus on high-yield exam concepts, cause-and-effect relationships, formulas/mechanisms, and common pitfalls while keeping language crisp and easy to revise."
            : "Balance clarity and completeness: give an easy-to-understand overview, highlight essential takeaways, and break down difficult topics in simple English.";

      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `Analyze the following student study notes and produce a structured study guide.\n\nStudy Notes:\n${notes}`,
          config: {
            systemInstruction: `You are an expert academic tutor for Smart Study AI. ${depthGuidance} Base every point strictly on the provided notes without inventing unrelated facts.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Short descriptive title for the study notes topic.",
                },
                overview: {
                  type: Type.STRING,
                  description: "Clear 2-3 paragraph plain-English summary of the material.",
                },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "5 to 8 concise, high-value bullet points highlighting the most important facts.",
                },
                simpleExplanations: {
                  type: Type.ARRAY,
                  description: "2 to 4 difficult or technical concepts from the notes explained in simple English.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      concept: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      analogy: {
                        type: Type.STRING,
                        description: "A concrete real-world comparison or example that makes the concept intuitive.",
                      },
                    },
                    required: ["concept", "explanation", "analogy"],
                  },
                },
                keyTerms: {
                  type: Type.ARRAY,
                  description: "4 to 8 key vocabulary terms and concise definitions.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                    },
                    required: ["term", "definition"],
                  },
                },
              },
              required: ["title", "overview", "keyPoints", "simpleExplanations", "keyTerms"],
            },
          },
        })
      );

      const summary = parseJsonSafe<{
        title: string;
        overview: string;
        keyPoints: string[];
        simpleExplanations: Array<{ concept: string; explanation: string; analogy: string }>;
        keyTerms: Array<{ term: string; definition: string }>;
      }>(response.text, "The AI returned an unexpected summary format. Please try again.");

      res.json(summary);
    } catch (error) {
      handleApiError(res, error, "Failed to generate study summary.");
    }
  });

  // Generate 5, 10, or 20 multiple-choice quiz questions
  app.post("/api/study/quiz", async (req: Request, res: Response) => {
    try {
      const notes = normalizeNotesInput(req.body?.notes);
      const rawCount = Number(req.body?.count);
      const count = rawCount === 5 || rawCount === 10 || rawCount === 20 ? rawCount : 5;
      const rawDifficulty = req.body?.difficulty;
      const difficulty: "foundational" | "balanced" | "challenge" =
        rawDifficulty === "foundational" || rawDifficulty === "challenge" ? rawDifficulty : "balanced";

      const difficultyNote =
        difficulty === "foundational"
          ? "Focus on core definitions, recall, and fundamental concepts."
          : difficulty === "challenge"
            ? "Include application, synthesis, and scenario-based questions with plausible distractors."
            : "Mix foundational comprehension with conceptual application questions.";

      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `Create exactly ${count} multiple-choice quiz questions based strictly on the study notes below.\n\nStudy Notes:\n${notes}`,
          config: {
            systemInstruction: `You are a rigorous educator building a multiple-choice quiz for Smart Study AI. Generate exactly ${count} distinct questions. Every question must have exactly 4 answer options, exactly one correct option (correctIndex 0-3), and a clear 1-2 sentence explanation of why the answer is right. ${difficultyNote} Vary the correctIndex across questions so the right answer is not always in the same position.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: {
                  type: Type.STRING,
                  description: "Concise quiz topic title.",
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Exactly 4 answer choices.",
                      },
                      correctIndex: {
                        type: Type.INTEGER,
                        description: "Zero-based index (0, 1, 2, or 3) of the correct option.",
                      },
                      explanation: {
                        type: Type.STRING,
                        description: "Clear explanation of why the correct option is right.",
                      },
                    },
                    required: ["question", "options", "correctIndex", "explanation"],
                  },
                },
              },
              required: ["topic", "questions"],
            },
          },
        })
      );

      const parsed = parseJsonSafe<{
        topic?: string;
        questions?: Array<{
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }>;
      }>(response.text, "The AI returned an unexpected quiz format. Please try again.");

      const validQuestions = (parsed.questions ?? [])
        .filter(
          (q) =>
            typeof q.question === "string" &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            Number.isInteger(q.correctIndex) &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3 &&
            typeof q.explanation === "string"
        )
        .slice(0, count)
        .map((q, idx) => ({
          id: `q-${Date.now()}-${idx}`,
          question: q.question.trim(),
          options: q.options.map((opt) => String(opt).trim()),
          correctIndex: q.correctIndex,
          explanation: q.explanation.trim(),
        }));

      if (validQuestions.length === 0) {
        throw createHttpError(502, "Could not generate valid quiz questions from these notes. Try adding more detail.");
      }

      res.json({
        topic: parsed.topic?.trim() || "Study Quiz",
        questions: validQuestions,
      });
    } catch (error) {
      handleApiError(res, error, "Failed to generate quiz questions.");
    }
  });

  // Generate interactive Q&A flashcards
  app.post("/api/study/flashcards", async (req: Request, res: Response) => {
    try {
      const notes = normalizeNotesInput(req.body?.notes);
      const rawCount = Number(req.body?.count);
      const count = Number.isInteger(rawCount) && rawCount >= 4 && rawCount <= 20 ? rawCount : 10;

      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `Create ${count} high-retention question-and-answer flashcards from these study notes.\n\nStudy Notes:\n${notes}`,
          config: {
            systemInstruction: `You are an active-recall study coach for Smart Study AI. Generate ${count} crisp flashcards. Each card should have a clear question or concept prompt on the front, a concise accurate answer on the back, and a short optional memory hint.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      front: {
                        type: Type.STRING,
                        description: "Question or concept prompt on the front of the flashcard.",
                      },
                      back: {
                        type: Type.STRING,
                        description: "Clear, concise answer or explanation on the back.",
                      },
                      hint: {
                        type: Type.STRING,
                        description: "A brief 3-10 word cue to jog memory before flipping.",
                      },
                    },
                    required: ["front", "back", "hint"],
                  },
                },
              },
              required: ["topic", "cards"],
            },
          },
        })
      );

      const parsed = parseJsonSafe<{
        topic?: string;
        cards?: Array<{ front: string; back: string; hint?: string }>;
      }>(response.text, "The AI returned an unexpected flashcard format. Please try again.");

      const validCards = (parsed.cards ?? [])
        .filter((c) => typeof c.front === "string" && typeof c.back === "string")
        .slice(0, count)
        .map((c, idx) => ({
          id: `fc-${Date.now()}-${idx}`,
          front: c.front.trim(),
          back: c.back.trim(),
          hint: typeof c.hint === "string" ? c.hint.trim() : "",
        }));

      if (validCards.length === 0) {
        throw createHttpError(502, "Could not generate flashcards from these notes. Try adding more detail.");
      }

      res.json({
        topic: parsed.topic?.trim() || "Study Flashcards",
        cards: validCards,
      });
    } catch (error) {
      handleApiError(res, error, "Failed to generate flashcards.");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*path}", (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Build artifacts not found. Run npm run build first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Study AI server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Smart Study AI server:", err);
  process.exit(1);
});
