import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getResults, setResults } from '@/lib/redis';
import type { QuestionsData, SubmitPayload, Attempt, MCQResult, ShortResult, CaseResult } from '@/lib/types';

async function readQuestions(): Promise<QuestionsData> {
  const fs = await import('fs');
  const path = await import('path');
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'questions.json'), 'utf-8');
  return JSON.parse(raw);
}

function evaluateAnswer(userAnswer: string, keywords: string[], maxMarks: number) {
  const lower = userAnswer.toLowerCase();
  const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  const raw = (matched.length / keywords.length) * maxMarks;
  return { marksAwarded: Math.min(Math.round(raw * 2) / 2, maxMarks), keywordsMatched: matched };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { username, mcqAnswers, shortAnswers, caseAnswers } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const questions = await readQuestions();

    const mcqResults: MCQResult[] = questions.mcq.map((q) => {
      const userAnswer = mcqAnswers[q.id.toString()] || '';
      const isCorrect = userAnswer === q.correct;
      return { questionId: q.id, userAnswer, correctAnswer: q.correct, isCorrect, marksAwarded: isCorrect ? 1 : 0 };
    });

    const shortResults: ShortResult[] = questions.short.map((q) => {
      const userAnswer = shortAnswers[q.id.toString()] || '';
      const { marksAwarded, keywordsMatched } = evaluateAnswer(userAnswer, q.keywords, q.marks);
      return { questionId: q.id, userAnswer, modelAnswer: q.modelAnswer, keywordsMatched, totalKeywords: q.keywords.length, marksAwarded, maxMarks: q.marks };
    });

    const caseResults: CaseResult[] = questions.case.map((q) => {
      const userAnswer = caseAnswers[q.id.toString()] || '';
      const { marksAwarded, keywordsMatched } = evaluateAnswer(userAnswer, q.keywords, q.marks);
      return { questionId: q.id, userAnswer, modelAnswer: q.modelAnswer, caseScenario: q.caseScenario, keywordsMatched, totalKeywords: q.keywords.length, marksAwarded, maxMarks: q.marks };
    });

    const mcqScore = mcqResults.reduce((s, r) => s + r.marksAwarded, 0);
    const shortScore = Math.round(shortResults.reduce((s, r) => s + r.marksAwarded, 0) * 10) / 10;
    const caseScore = Math.round(caseResults.reduce((s, r) => s + r.marksAwarded, 0) * 10) / 10;
    const totalScore = Math.round((mcqScore + shortScore + caseScore) * 10) / 10;
    const percentage = Math.round((totalScore / 55) * 100 * 10) / 10;
    const passed = totalScore >= 22;

    const resultsData = await getResults();
    const existing = resultsData[username] || [];
    const attemptId = randomUUID();

    const attempt: Attempt = {
      attemptId,
      attemptNumber: existing.length + 1,
      submittedAt: new Date().toISOString(),
      mcqAnswers, shortAnswers, caseAnswers,
      mcqResults, shortResults, caseResults,
      mcqScore, shortScore, caseScore, totalScore, percentage, passed,
    };

    resultsData[username] = [...existing, attempt];
    await setResults(resultsData);

    return NextResponse.json({ success: true, attemptId, scores: { mcqScore, shortScore, caseScore, totalScore, percentage, passed } });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
