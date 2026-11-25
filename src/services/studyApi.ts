import type {
  Flashcard,
  QuizCount,
  QuizDifficulty,
  QuizQuestion,
  StudySummary,
  SummaryDepth,
} from "../types/study";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === "string" && payload.error.trim()
        ? payload.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function extractPdfNotes(file: File): Promise<{ text: string; fileName: string }> {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Could not read PDF file bytes."));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(new Error("Failed to read the selected PDF file."));
    reader.readAsDataURL(file);
  });

  return postJson<{ text: string; fileName: string }>("/api/notes/extract-pdf", {
    base64Data,
    fileName: file.name,
  });
}

export async function generateStudySummary(
  notes: string,
  depth: SummaryDepth
): Promise<StudySummary> {
  const data = await postJson<Omit<StudySummary, "depth" | "generatedAt">>("/api/study/summarize", {
    notes,
    depth,
  });
  return {
    ...data,
    depth,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateStudyQuiz(
  notes: string,
  count: QuizCount,
  difficulty: QuizDifficulty
): Promise<{ topic: string; questions: QuizQuestion[] }> {
  return postJson<{ topic: string; questions: QuizQuestion[] }>("/api/study/quiz", {
    notes,
    count,
    difficulty,
  });
}

export async function generateFlashcards(
  notes: string,
  count = 10
): Promise<{ topic: string; cards: Flashcard[] }> {
  return postJson<{ topic: string; cards: Flashcard[] }>("/api/study/flashcards", {
    notes,
    count,
  });
}
