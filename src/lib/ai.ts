export type AIProviderName = "none" | "openai" | "openrouter" | "custom" | "self-hosted";

const PROVIDER = (process.env.AI_PROVIDER || "none").toLowerCase();
const API_KEY = process.env.AI_API_KEY;
const BASE_URL = process.env.AI_BASE_URL;
const MODEL = process.env.AI_MODEL || "gpt-3.5-turbo";

function isConfigured(): boolean {
  return PROVIDER !== "none" && Boolean(API_KEY);
}

function providerName(): AIProviderName {
  return ((PROVIDER as AIProviderName) || "none") as AIProviderName;
}

async function chatComplete(messages: { role: string; content: string }[], options?: {
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const base = BASE_URL || "https://api.openai.com/v1";
  const url = base.endsWith("/") ? base + "chat/completions" : base + "/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.4,
      max_tokens: options?.maxTokens ?? 1500,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider error: ${res.status} ${body}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error("AI provider returned no completion");
  const content = choice.message?.content ?? choice.text ?? "";
  return typeof content === "string" ? content : String(content);
}

export async function complete(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ text: string; provider: string; grounded: boolean }> {
  if (!isConfigured()) {
    return { text: "", provider: "none", grounded: false };
  }
  const text = await chatComplete([{ role: "user", content: prompt }], options);
  return { text, provider: providerName(), grounded: false };
}

export async function generateReviewer({
  sourceText,
  title,
  format = "standard",
  difficulty = "medium",
  language = "en",
}: {
  sourceText: string;
  title: string;
  format?: "concise" | "standard" | "detailed";
  difficulty?: "easy" | "medium" | "hard";
  language?: string;
}): Promise<{
  content: any;
  provider: string;
  grounded: boolean;
}> {
  const grounded = Boolean(sourceText && sourceText.trim().length > 0);
  if (!isConfigured()) {
    return {
      content: buildFallbackReviewer({ sourceText, title, format, difficulty, language }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
  const prompt = `
You are an academic reviewer generator. Create a study reviewer based on the source material below.
Title: ${title}
Format: ${format} (concise | standard | detailed)
Difficulty: ${difficulty}
Language: ${language}

Source material:
${sourceText}

Return a JSON object with keys: overview, definitions (array), concepts (array), explanations (array), examples (array), formulas (array), comparisons (array), steps (array), mistakes (array), practiceQuestions (array), memoryTips (array), summary (array). Ground every item in the source material. Mark any item that cannot be verified from the source with "unverified": true.`;
  try {
    const text = await chatComplete([{ role: "user", content: prompt }]);
    let content: any;
    try {
      content = JSON.parse(text);
    } catch {
      content = buildFallbackReviewer({ sourceText, title, format, difficulty, language });
    }
    return { content, provider: providerName(), grounded };
  } catch {
    return {
      content: buildFallbackReviewer({ sourceText, title, format, difficulty, language }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
}

export async function generateQuiz({
  sourceText,
  title,
  questionCount = 10,
  difficulty = "medium",
  language = "en",
}: {
  sourceText: string;
  title: string;
  questionCount?: number;
  difficulty?: "easy" | "medium" | "hard";
  language?: string;
}): Promise<{
  questions: any[];
  provider: string;
  grounded: boolean;
}> {
  const grounded = Boolean(sourceText && sourceText.trim().length > 0);
  if (!isConfigured()) {
    return {
      questions: buildFallbackQuiz({ sourceText, title, questionCount, difficulty, language }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
  const prompt = `
Generate ${questionCount} quiz questions from the source material.
Title: ${title}
Difficulty: ${difficulty}
Language: ${language}

Source material:
${sourceText}

Return a JSON array. Each item: { type: "MULTIPLE_CHOICE"|"TRUE_FALSE"|"IDENTIFICATION"|"FILL_IN_BLANK"|"SHORT_ANSWER", question: string, options: string[] (for multiple choice), correctAnswer: string, explanation: string, points: number }. Ground answers in the source.`;
  try {
    const text = await chatComplete([{ role: "user", content: prompt }]);
    let questions: any[];
    try {
      questions = JSON.parse(text);
    } catch {
      questions = buildFallbackQuiz({ sourceText, title, questionCount, difficulty, language });
    }
    return { questions, provider: providerName(), grounded };
  } catch {
    return {
      questions: buildFallbackQuiz({ sourceText, title, questionCount, difficulty, language }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
}

export async function generateFlashcards({
  sourceText,
  title,
  count = 10,
  language = "en",
}: {
  sourceText: string;
  title: string;
  count?: number;
  language?: string;
}): Promise<{
  cards: { front: string; back: string }[];
  provider: string;
  grounded: boolean;
}> {
  const grounded = Boolean(sourceText && sourceText.trim().length > 0);
  if (!isConfigured()) {
    return {
      cards: buildFallbackFlashcards({ sourceText, title, count, language }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
  const prompt = `
Generate ${count} flashcards (question/answer) from the source material.
Title: ${title}
Language: ${language}

Source material:
${sourceText}

Return a JSON array of { front: string, back: string }. Ground answers in the source.`;
  try {
    const text = await chatComplete([{ role: "user", content: prompt }]);
    let cards: any[];
    try {
      cards = JSON.parse(text);
    } catch {
      cards = buildFallbackFlashcards({ sourceText, title, count, language });
    }
    return { cards, provider: providerName(), grounded };
  } catch {
    return {
      cards: buildFallbackFlashcards({ sourceText, title, count, language }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
}

export async function tutorReply({
  message,
  history,
  sourceText,
  language = "en",
  level = "intermediate",
}: {
  message: string;
  history: { role: string; content: string }[];
  sourceText?: string;
  language?: string;
  level?: "beginner" | "intermediate" | "advanced";
}): Promise<{ text: string; provider: string; grounded: boolean }> {
  const grounded = Boolean(sourceText && sourceText.trim().length > 0);
  if (!isConfigured()) {
    return {
      text: buildFallbackTutor({ message, sourceText, language, level }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
  const context = sourceText ? `\nSource material:\n${sourceText}\n` : "";
  const prompt = `You are a patient AI study tutor. Explain in simple language appropriate for a ${level} learner.
Language: ${language}
Use the source material when provided and say when something cannot be verified from it.${context}

Conversation history:
${history.map((h) => `${h.role}: ${h.content}`).join("\n")}

Student: ${message}
Tutor:`;
  try {
    const text = await chatComplete([{ role: "user", content: prompt }]);
    return { text, provider: providerName(), grounded };
  } catch {
    return {
      text: buildFallbackTutor({ message, sourceText, language, level }),
      provider: "deterministic-fallback",
      grounded: grounded && (sourceText?.length ?? 0) > 0,
    };
  }
}

export async function grammarCheck(text: string): Promise<{
  suggestions: string[];
  provider: string;
}> {
  if (!isConfigured()) {
    return { suggestions: [], provider: "deterministic-fallback" };
  }
  try {
    const content = await chatComplete(
      [
        {
          role: "user",
          content: `Check grammar and suggest improvements for academic writing. Return a JSON array of suggestion strings.\nText:\n${text}`,
        },
      ],
      { maxTokens: 600 }
    );
    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(content);
    } catch {
      suggestions = [];
    }
    return { suggestions, provider: providerName() };
  } catch {
    return { suggestions: [], provider: "deterministic-fallback" };
  }
}

// ---------- Deterministic fallbacks ----------

function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function keywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);
}

function buildFallbackReviewer({
  sourceText,
  title,
  format,
  difficulty,
  language,
}: {
  sourceText: string;
  title: string;
  format: string;
  difficulty: string;
  language: string;
}) {
  const sents = sentences(sourceText);
  const kws = keywords(sourceText);
  const overview = sents.slice(0, 3).join(". ") || title;
  const definitions = kws.slice(0, 8).map((kw) => ({
    term: kw,
    definition: `Key concept related to "${kw}" in ${title}. Review source material for full definition.`,
    unverified: true,
  }));
  const concepts = kws.slice(0, 8).map((kw) => ({ title: kw, description: "", unverified: true }));
  const explanations = sents.slice(0, 5).map((s) => ({ text: s, unverified: false }));
  const examples: any[] = [];
  const formulas: any[] = [];
  const comparisons: any[] = [];
  const steps = sents.slice(0, 4).map((s) => ({ step: s, unverified: false }));
  const mistakes = [{ text: "Avoid skipping source verification.", unverified: true }];
  const practiceQuestions = sents.slice(0, 5).map((s, i) => ({
    question: `Based on the material: ${s}`,
    answer: "Refer to the source text.",
    type: "SHORT_ANSWER",
  }));
  const memoryTips = ["Review the source material regularly.", "Create your own summaries."];
  const summary = [overview];

  return {
    title,
    format,
    difficulty,
    language,
    overview,
    definitions,
    concepts,
    explanations,
    examples,
    formulas,
    comparisons,
    steps,
    mistakes,
    practiceQuestions,
    memoryTips,
    summary,
    generatedBy: "deterministic-fallback",
    note: "No AI provider configured. This is a deterministic summary generated from extracted text. Verify all content.",
  };
}

function buildFallbackQuiz({
  sourceText,
  title,
  questionCount,
  difficulty,
  language,
}: {
  sourceText: string;
  title: string;
  questionCount: number;
  difficulty: string;
  language: string;
}) {
  const sents = sentences(sourceText);
  const questions: any[] = [];
  for (let i = 0; i < Math.min(questionCount, sents.length); i++) {
    questions.push({
      type: "SHORT_ANSWER",
      question: `What does the material say about: ${sents[i]}`,
      correctAnswer: sents[i],
      explanation: "Derived directly from extracted source text.",
      points: 1,
    });
  }
  if (questions.length === 0) {
    questions.push({
      type: "SHORT_ANSWER",
      question: `Summarize the key point of "${title}".`,
      correctAnswer: "Refer to the source material.",
      explanation: "No extractable sentences found.",
      points: 1,
    });
  }
  return questions;
}

function buildFallbackFlashcards({
  sourceText,
  title,
  count,
  language,
}: {
  sourceText: string;
  title: string;
  count: number;
  language: string;
}) {
  const sents = sentences(sourceText);
  const cards: { front: string; back: string }[] = [];
  for (let i = 0; i < Math.min(count, sents.length); i++) {
    cards.push({ front: `Q: ${sents[i]}`, back: `A: ${sents[i]}` });
  }
  if (cards.length === 0) {
    cards.push({ front: `What is ${title} about?`, back: "Review the uploaded source material." });
  }
  return cards;
}

function buildFallbackTutor({
  message,
  sourceText,
  language,
  level,
}: {
  message: string;
  sourceText?: string;
  language: string;
  level: string;
}) {
  if (sourceText) {
    return `Based on your course material: ${sourceText.slice(0, 300)}... (No AI provider configured; this is a deterministic excerpt from your uploaded material.)`;
  }
  return `I'm your study tutor. No AI provider is currently configured, so I can't generate a detailed explanation. Please consult your course materials or configure a compatible AI provider later.`;
}
