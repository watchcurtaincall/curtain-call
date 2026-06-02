import { QuizQuestionInternal } from '@/lib/types';
import { FALLBACK_QUESTIONS } from './fallbackQuestions';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFallbackQuestions(count = 5): QuizQuestionInternal[] {
  const shuffled = shuffleArray(FALLBACK_QUESTIONS);
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: crypto.randomUUID(),
    index: i,
  }));
}

function parseGeminiQuestions(raw: string): QuizQuestionInternal[] | null {
  try {
    // Strip markdown code fences if present anywhere
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length !== 5) return null;
    for (const q of parsed) {
      if (
        typeof q.text !== 'string' ||
        !Array.isArray(q.options) || q.options.length !== 4 ||
        typeof q.correctAnswerIndex !== 'number' ||
        !['easy', 'medium', 'hard'].includes(q.difficulty) ||
        typeof q.theme !== 'string'
      ) return null;
    }
    return parsed.map((q: any, i: number) => ({ ...q, id: crypto.randomUUID(), index: i }));
  } catch {
    return null;
  }
}

const PROMPT = `You are a theatre quiz master specialising in West African theatre, Shakespeare, classical drama, and global stage arts.

Generate exactly 5 unique multiple-choice theatre trivia questions for today's Daily Quiz. Follow these rules:
- Questions 1-2: difficulty "easy"
- Questions 3-4: difficulty "medium"
- Question 5: difficulty "hard"
- Each question MUST have exactly 4 answer options
- correctAnswerIndex is 0-based (0, 1, 2, or 3)
- Cover a variety of themes: mix between Nigerian theatre, African playwrights, Shakespeare, classical Greek drama, stage terminology, acting theory, and musicals
- Do NOT repeat questions from previous days; vary the topics
- Return ONLY a valid JSON array with no extra text, no markdown fences

JSON schema for each question:
{
  "text": string,
  "options": [string, string, string, string],
  "correctAnswerIndex": number,
  "difficulty": "easy" | "medium" | "hard",
  "theme": string
}`;

export async function generateQuizQuestions(recentQuestionsContext?: string): Promise<{
  questions: QuizQuestionInternal[];
  source: 'ai' | 'fallback';
}> {
  const finalPrompt = `${PROMPT}
  
${recentQuestionsContext ? `Here are the questions that have been asked recently. Under no circumstances should you repeat these exact questions, and you should try to avoid these specific topics if possible:
${recentQuestionsContext}` : ''}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[QuestionGen] No GEMINI_API_KEY, using fallback questions.');
    return { questions: pickFallbackQuestions(), source: 'fallback' };
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      console.error('[QuestionGen] Gemini API error:', res.status, await res.text());
      return { questions: pickFallbackQuestions(), source: 'fallback' };
    }

    const data = await res.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const questions = parseGeminiQuestions(rawText);
    if (!questions) {
      console.error('[QuestionGen] Failed to parse Gemini response, using fallback. Raw:', rawText.slice(0, 500));
      return { questions: pickFallbackQuestions(), source: 'fallback' };
    }

    return { questions, source: 'ai' };
  } catch (err) {
    console.error('[QuestionGen] Unexpected error, using fallback:', err);
    return { questions: pickFallbackQuestions(), source: 'fallback' };
  }
}
