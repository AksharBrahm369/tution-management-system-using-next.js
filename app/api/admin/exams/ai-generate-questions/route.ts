import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRouteErrorStatus, requireAdmin } from "@/lib/roleAuth";

export const runtime = "nodejs";

const requestSchema = z.object({
  notes: z.string().trim().min(20, "Please provide enough notes for AI to generate questions"),
  questionCount: z.number().int().min(1, "At least 1 question is required").max(25, "You can generate up to 25 questions at once"),
  examTitle: z.string().trim().optional(),
  subjectName: z.string().trim().optional(),
  hasNegativeMarking: z.boolean().optional(),
  pattern: z.enum(["STANDARD_MIXED", "MCQ_HEAVY", "THEORY_HEAVY"]).optional(),
});

const allowedQuestionTypes = new Set(["MCQ", "SHORT_ANSWER", "LONG_ANSWER", "TRUE_FALSE", "FILL_BLANK" ]);
const allowedDifficulties = new Set(["EASY", "MEDIUM", "HARD"]);

type GeneratedQuestion = {
  questionText?: unknown;
  questionType?: unknown;
  marks?: unknown;
  optionA?: unknown;
  optionB?: unknown;
  optionC?: unknown;
  optionD?: unknown;
  correctOption?: unknown;
  modelAnswer?: unknown;
  answerKeyPoints?: unknown;
  topic?: unknown;
  difficulty?: unknown;
};

function stripCodeFences(value: string) {
  let cleaned = value.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

function extractFirstJsonObject(value: string) {
  const cleaned = stripCodeFences(value);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function sanitizeQuestion(question: GeneratedQuestion, index: number, hasNegativeMarking: boolean) {
  const rawType = String(question.questionType ?? "MCQ").trim().toUpperCase();
  const questionType = allowedQuestionTypes.has(rawType) ? rawType : "MCQ";
  const difficultyValue = String(question.difficulty ?? "MEDIUM").trim().toUpperCase();
  const difficulty = allowedDifficulties.has(difficultyValue) ? difficultyValue : "MEDIUM";
  const marks = Math.max(1, Number(question.marks ?? (questionType === "LONG_ANSWER" ? 5 : questionType === "SHORT_ANSWER" ? 2 : 1)));

  const baseQuestion = {
    questionNumber: index + 1,
    questionText: String(question.questionText ?? "").trim(),
    questionType,
    marks,
    negativeMarks: hasNegativeMarking ? 0 : 0,
    topic: String(question.topic ?? "").trim() || null,
    difficulty,
    answerKeyPoints: toStringArray(question.answerKeyPoints),
  };

  if (questionType === "MCQ") {
    const options = [
      String(question.optionA ?? "").trim(),
      String(question.optionB ?? "").trim(),
      String(question.optionC ?? "").trim(),
      String(question.optionD ?? "").trim(),
    ];
    const safeOptions = options.map((option, optionIndex) => option || `Option ${String.fromCharCode(65 + optionIndex)}`);
    const correctOptionValue = String(question.correctOption ?? "A").trim().toUpperCase();
    const correctOption = ["A", "B", "C", "D"].includes(correctOptionValue) ? correctOptionValue : "A";

    return {
      ...baseQuestion,
      optionA: safeOptions[0],
      optionB: safeOptions[1],
      optionC: safeOptions[2],
      optionD: safeOptions[3],
      correctOption,
      modelAnswer: null,
    };
  }

  if (questionType === "TRUE_FALSE") {
    const correctOptionValue = String(question.correctOption ?? "A").trim().toUpperCase();
    const correctOption = correctOptionValue === "B" || correctOptionValue === "FALSE" ? "B" : "A";

    return {
      ...baseQuestion,
      optionA: "True",
      optionB: "False",
      optionC: null,
      optionD: null,
      correctOption,
      modelAnswer: String(question.modelAnswer ?? "").trim() || null,
    };
  }

  return {
    ...baseQuestion,
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    correctOption: null,
    modelAnswer: String(question.modelAnswer ?? "").trim() || null,
  };
}

function getTypePlan(questionCount: number, pattern: z.infer<typeof requestSchema>["pattern"]) {
  if (pattern === "MCQ_HEAVY") {
    return Array.from({ length: questionCount }, (_, index) => {
      if (index < Math.ceil(questionCount * 0.6)) return "MCQ";
      if (index < Math.ceil(questionCount * 0.75)) return "TRUE_FALSE";
      if (index < Math.ceil(questionCount * 0.9)) return "SHORT_ANSWER";
      return "FILL_BLANK";
    });
  }

  if (pattern === "THEORY_HEAVY") {
    return Array.from({ length: questionCount }, (_, index) => {
      if (index < Math.ceil(questionCount * 0.2)) return "MCQ";
      if (index < Math.ceil(questionCount * 0.55)) return "SHORT_ANSWER";
      if (index < Math.ceil(questionCount * 0.85)) return "LONG_ANSWER";
      return "TRUE_FALSE";
    });
  }

  return Array.from({ length: questionCount }, (_, index) => {
    if (index < Math.ceil(questionCount * 0.4)) return "MCQ";
    if (index < Math.ceil(questionCount * 0.55)) return "TRUE_FALSE";
    if (index < Math.ceil(questionCount * 0.75)) return "SHORT_ANSWER";
    if (index < Math.ceil(questionCount * 0.9)) return "FILL_BLANK";
    return "LONG_ANSWER";
  });
}

function buildMcqFromChunk(chunk: string, subjectName: string | undefined, index: number) {
  return {
    questionText: `Which statement best matches this concept${subjectName ? ` in ${subjectName}` : ""}: ${chunk}?`,
    questionType: "MCQ",
    marks: 1,
    optionA: chunk,
    optionB: `A partially incorrect interpretation of ${subjectName || "the concept"}`,
    optionC: `An unrelated idea from a different topic`,
    optionD: `A common misconception about the topic`,
    correctOption: "A",
    topic: subjectName ?? `Topic ${index + 1}`,
    difficulty: index % 3 === 0 ? "EASY" : "MEDIUM",
  };
}

function buildTrueFalseFromChunk(chunk: string, subjectName: string | undefined, index: number) {
  return {
    questionText: `True or False: ${chunk}`,
    questionType: "TRUE_FALSE",
    marks: 1,
    correctOption: "A",
    modelAnswer: chunk,
    answerKeyPoints: [chunk],
    topic: subjectName ?? `Topic ${index + 1}`,
    difficulty: "EASY",
  };
}

function buildShortAnswerFromChunk(chunk: string, subjectName: string | undefined, index: number) {
  return {
    questionText: `Write a short answer on the following${subjectName ? ` from ${subjectName}` : ""}: ${chunk}`,
    questionType: "SHORT_ANSWER",
    marks: 2,
    modelAnswer: chunk,
    answerKeyPoints: chunk.split(/[,.]/).map((part) => part.trim()).filter(Boolean).slice(0, 4),
    topic: subjectName ?? `Topic ${index + 1}`,
    difficulty: "MEDIUM",
  };
}

function buildLongAnswerFromChunk(chunk: string, subjectName: string | undefined, index: number) {
  return {
    questionText: `Explain in detail${subjectName ? ` with reference to ${subjectName}` : ""}: ${chunk}`,
    questionType: "LONG_ANSWER",
    marks: 5,
    modelAnswer: chunk,
    answerKeyPoints: chunk.split(/[,.]/).map((part) => part.trim()).filter(Boolean).slice(0, 6),
    topic: subjectName ?? `Topic ${index + 1}`,
    difficulty: "HARD",
  };
}

function buildFillBlankFromChunk(chunk: string, subjectName: string | undefined, index: number) {
  const words = chunk.split(/\s+/).filter(Boolean);
  const blankWord = words.find((word) => word.replace(/[^a-zA-Z0-9]/g, "").length > 4) ?? words[0] ?? "term";
  const escapedWord = blankWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const questionText = chunk.replace(new RegExp(escapedWord, "i"), "_____");

  return {
    questionText: `Fill in the blank${subjectName ? ` for ${subjectName}` : ""}: ${questionText}`,
    questionType: "FILL_BLANK",
    marks: 1,
    modelAnswer: blankWord,
    answerKeyPoints: [blankWord],
    topic: subjectName ?? `Topic ${index + 1}`,
    difficulty: "MEDIUM",
  };
}

function buildFallbackQuestions(notes: string, questionCount: number, subjectName?: string, pattern: z.infer<typeof requestSchema>["pattern"] = "STANDARD_MIXED") {
  const chunks = notes
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 20);

  const source = chunks.length ? chunks : [notes.trim()];
  const typePlan = getTypePlan(questionCount, pattern);

  return Array.from({ length: questionCount }, (_, index) => {
    const chunk = source[index % source.length];
    const type = typePlan[index];

    if (type === "MCQ") return sanitizeQuestion(buildMcqFromChunk(chunk, subjectName, index), index, false);
    if (type === "TRUE_FALSE") return sanitizeQuestion(buildTrueFalseFromChunk(chunk, subjectName, index), index, false);
    if (type === "LONG_ANSWER") return sanitizeQuestion(buildLongAnswerFromChunk(chunk, subjectName, index), index, false);
    if (type === "FILL_BLANK") return sanitizeQuestion(buildFillBlankFromChunk(chunk, subjectName, index), index, false);

    return sanitizeQuestion(buildShortAnswerFromChunk(chunk, subjectName, index), index, false);
  });
}

async function generateWithGemini(input: z.infer<typeof requestSchema>) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const typePlan = getTypePlan(input.questionCount, input.pattern);
  const typeMixSummary = typePlan.reduce<Record<string, number>>((acc, type) => {
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  const patternInstruction =
    input.pattern === "MCQ_HEAVY"
      ? "Generate an online test that is mostly MCQs with a few true/false and short-answer questions."
      : input.pattern === "THEORY_HEAVY"
        ? "Generate a theory-style paper with more short and long answers, while still keeping some objective questions."
        : "Generate a standard mixed exam paper pattern with objective, short-answer, fill-in-the-blank, true/false, and long-answer questions.";

  const prompt = `You are generating online exam questions for a tuition management system.

Create exactly ${input.questionCount} high-quality questions from the admin's notes.

Context:
- Exam title: ${input.examTitle || "Online Exam"}
- Subject: ${input.subjectName || "General"}
- Required paper pattern: ${input.pattern || "STANDARD_MIXED"}
- Required mix by type: ${JSON.stringify(typeMixSummary)}
- Notes:
${input.notes}

Rules:
- ${patternInstruction}
- Follow a real exam-paper style. Vary the stems naturally: use direct questions, application/problem-solving prompts, assertion-style checks, fill-in-the-blank items, and longer theory answers where suitable.
- Keep questions strictly grounded in the provided notes.
- Include some problem-solving or applied questions whenever the notes contain formulas, procedures, examples, calculations, steps, or rules.
- For MCQ, always provide 4 options and a correctOption using A, B, C, or D.
- For TRUE_FALSE, use correctOption A for True and B for False.
- For non-MCQ questions, provide a concise modelAnswer and answerKeyPoints array.
- Marks should usually be 1 for MCQ/TRUE_FALSE/FILL_BLANK, 2 for SHORT_ANSWER, and 5 for LONG_ANSWER unless the notes clearly justify otherwise.
- difficulty must be one of EASY, MEDIUM, HARD.
- questionType must be one of MCQ, SHORT_ANSWER, LONG_ANSWER, TRUE_FALSE, FILL_BLANK.
- Do not repeat the same wording pattern across questions.
- Make sure the set of questions feels like a proper school exam paper, not a repeated template.

Return raw JSON only in this shape:
{
  "questions": [
    {
      "questionText": "string",
      "questionType": "MCQ",
      "marks": 1,
      "optionA": "string",
      "optionB": "string",
      "optionC": "string",
      "optionD": "string",
      "correctOption": "A",
      "modelAnswer": "string or null",
      "answerKeyPoints": ["point 1", "point 2"],
      "topic": "string",
      "difficulty": "MEDIUM"
    }
  ]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error?.message || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(extractFirstJsonObject(String(rawText)));
  if (!Array.isArray(parsed.questions)) return null;

  return parsed.questions as GeneratedQuestion[];
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const input = requestSchema.parse(await request.json());

    let generatedQuestions: GeneratedQuestion[] | null = null;

    try {
      generatedQuestions = await generateWithGemini(input);
    } catch (error) {
      console.error("AI question generation failed, falling back to local generator:", error);
    }

    const normalizedQuestions = (generatedQuestions ?? buildFallbackQuestions(input.notes, input.questionCount, input.subjectName, input.pattern))
      .slice(0, input.questionCount)
      .map((question, index) => sanitizeQuestion(question, index, Boolean(input.hasNegativeMarking)))
      .filter((question) => question.questionText.length > 0);

    if (!normalizedQuestions.length) {
      return NextResponse.json({ error: "AI could not generate valid questions from the provided notes." }, { status: 400 });
    }

    return NextResponse.json({
      questions: normalizedQuestions,
      generatedCount: normalizedQuestions.length,
    });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
