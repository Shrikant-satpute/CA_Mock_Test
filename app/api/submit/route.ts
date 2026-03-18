// =============================================================================
// POST /api/submit
// Evaluates exam answers and saves attempt to Vercel KV (production)
// or /data/results.json (local development fallback)
//
// STORAGE STRATEGY:
//   - Production (Vercel): Uses @vercel/kv — KV_REST_API_URL env var must be set
//   - Local dev: Falls back to fs JSON file automatically
//
// KV KEY USED: "results"  →  stores the full ResultsData object as JSON
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type {
  QuestionsData,
  ResultsData,
  SubmitPayload,
  Attempt,
  MCQResult,
  ShortResult,
  CaseResult,
} from '@/lib/types';

// ── Storage helpers (KV ↔ fs fallback) ────────────────────────────────────────

async function readResults(): Promise<ResultsData> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return (await kv.get<ResultsData>('results')) ?? {};
  }
  const fs = await import('fs');
  const path = await import('path');
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'results.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeResults(data: ResultsData): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    await kv.set('results', data);
    return;
  }
  const fs = await import('fs');
  const path = await import('path');
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'results.json'),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

async function readQuestions(): Promise<QuestionsData> {
  const fs = await import('fs');
  const path = await import('path');
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'questions.json'), 'utf-8');
  return JSON.parse(raw);
}

// ── Keyword scoring ────────────────────────────────────────────────────────────

function evaluateShortAnswer(
  userAnswer: string,
  keywords: string[],
  maxMarks: number
): { marksAwarded: number; keywordsMatched: string[] } {
  const lowerAnswer = userAnswer.toLowerCase();
  const matched = keywords.filter((kw) => lowerAnswer.includes(kw.toLowerCase()));
  const ratio = matched.length / keywords.length;
  const rawScore = ratio * maxMarks;
  const marksAwarded = Math.round(rawScore * 2) / 2;
  return { marksAwarded: Math.min(marksAwarded, maxMarks), keywordsMatched: matched };
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { username, mcqAnswers, shortAnswers, caseAnswers } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const questions = await readQuestions();

    // Evaluate MCQ
    const mcqResults: MCQResult[] = questions.mcq.map((q) => {
      const userAnswer = mcqAnswers[q.id.toString()] || '';
      const isCorrect = userAnswer === q.correct;
      return { questionId: q.id, userAnswer, correctAnswer: q.correct, isCorrect, marksAwarded: isCorrect ? 1 : 0 };
    });
    const mcqScore = mcqResults.reduce((sum, r) => sum + r.marksAwarded, 0);

    // Evaluate Short Answers
    const shortResults: ShortResult[] = questions.short.map((q) => {
      const userAnswer = shortAnswers[q.id.toString()] || '';
      const { marksAwarded, keywordsMatched } = evaluateShortAnswer(userAnswer, q.keywords, q.marks);
      return { questionId: q.id, userAnswer, modelAnswer: q.modelAnswer, keywordsMatched, totalKeywords: q.keywords.length, marksAwarded, maxMarks: q.marks };
    });
    const shortScore = shortResults.reduce((sum, r) => sum + r.marksAwarded, 0);

    // Evaluate Case Answers
    const caseResults: CaseResult[] = questions.case.map((q) => {
      const userAnswer = caseAnswers[q.id.toString()] || '';
      const { marksAwarded, keywordsMatched } = evaluateShortAnswer(userAnswer, q.keywords, q.marks);
      return { questionId: q.id, userAnswer, modelAnswer: q.modelAnswer, caseScenario: q.caseScenario, keywordsMatched, totalKeywords: q.keywords.length, marksAwarded, maxMarks: q.marks };
    });
    const caseScore = caseResults.reduce((sum, r) => sum + r.marksAwarded, 0);

    const totalScore = Math.round((mcqScore + shortScore + caseScore) * 10) / 10;
    const percentage = Math.round((totalScore / 55) * 100 * 10) / 10;
    const passed = totalScore >= 22;

    // Read → modify → write
    const resultsData = await readResults();
    const existingAttempts = resultsData[username] || [];
    const attemptId = randomUUID();

    const attempt: Attempt = {
      attemptId,
      attemptNumber: existingAttempts.length + 1,
      submittedAt: new Date().toISOString(),
      mcqAnswers,
      shortAnswers,
      caseAnswers,
      mcqResults,
      shortResults,
      caseResults,
      mcqScore,
      shortScore: Math.round(shortScore * 10) / 10,
      caseScore: Math.round(caseScore * 10) / 10,
      totalScore,
      percentage,
      passed,
    };

    resultsData[username] = [...existingAttempts, attempt];
    await writeResults(resultsData);

    return NextResponse.json({ success: true, attemptId, scores: { mcqScore, shortScore: attempt.shortScore, caseScore: attempt.caseScore, totalScore, percentage, passed } });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
