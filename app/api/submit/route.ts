// =============================================================================
// POST /api/submit
// Evaluates exam answers and saves attempt to /data/results.json
//
// ⚠️ VERCEL DEPLOYMENT NOTE:
// fs.writeFile to /data/results.json will NOT persist on Vercel serverless.
// Each function invocation may run in a fresh container.
// TO REPLACE with Vercel KV:
//   Line marked "// REPLACE": await kv.set(`results:${username}`, attempts);
// TO REPLACE with MongoDB Atlas:
//   Line marked "// REPLACE": await collection.insertOne(attemptObject);
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

function evaluateShortAnswer(
  userAnswer: string,
  keywords: string[],
  maxMarks: number
): { marksAwarded: number; keywordsMatched: string[] } {
  const lowerAnswer = userAnswer.toLowerCase();
  const matched = keywords.filter((kw) =>
    lowerAnswer.includes(kw.toLowerCase())
  );
  const ratio = matched.length / keywords.length;
  // Round to nearest 0.5
  const rawScore = ratio * maxMarks;
  const marksAwarded = Math.round(rawScore * 2) / 2;
  return { marksAwarded: Math.min(marksAwarded, maxMarks), keywordsMatched: matched };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { username, mcqAnswers, shortAnswers, caseAnswers } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Load questions
    const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
    const questionsRaw = fs.readFileSync(questionsPath, 'utf-8');
    const questions: QuestionsData = JSON.parse(questionsRaw);

    // Evaluate MCQ
    const mcqResults: MCQResult[] = questions.mcq.map((q) => {
      const userAnswer = mcqAnswers[q.id.toString()] || '';
      const isCorrect = userAnswer === q.correct;
      return {
        questionId: q.id,
        userAnswer,
        correctAnswer: q.correct,
        isCorrect,
        marksAwarded: isCorrect ? 1 : 0,
      };
    });
    const mcqScore = mcqResults.reduce((sum, r) => sum + r.marksAwarded, 0);

    // Evaluate Short Answers
    const shortResults: ShortResult[] = questions.short.map((q) => {
      const userAnswer = shortAnswers[q.id.toString()] || '';
      const { marksAwarded, keywordsMatched } = evaluateShortAnswer(
        userAnswer,
        q.keywords,
        q.marks
      );
      return {
        questionId: q.id,
        userAnswer,
        modelAnswer: q.modelAnswer,
        keywordsMatched,
        totalKeywords: q.keywords.length,
        marksAwarded,
        maxMarks: q.marks,
      };
    });
    const shortScore = shortResults.reduce((sum, r) => sum + r.marksAwarded, 0);

    // Evaluate Case Answers
    const caseResults: CaseResult[] = questions.case.map((q) => {
      const userAnswer = caseAnswers[q.id.toString()] || '';
      const { marksAwarded, keywordsMatched } = evaluateShortAnswer(
        userAnswer,
        q.keywords,
        q.marks
      );
      return {
        questionId: q.id,
        userAnswer,
        modelAnswer: q.modelAnswer,
        caseScenario: q.caseScenario,
        keywordsMatched,
        totalKeywords: q.keywords.length,
        marksAwarded,
        maxMarks: q.marks,
      };
    });
    const caseScore = caseResults.reduce((sum, r) => sum + r.marksAwarded, 0);

    const totalScore = mcqScore + shortScore + caseScore;
    const percentage = Math.round((totalScore / 55) * 100 * 10) / 10;
    const passed = totalScore >= 22;

    // Load existing results
    const resultsPath = path.join(process.cwd(), 'data', 'results.json');
    let resultsData: ResultsData = {};
    try {
      const resultsRaw = fs.readFileSync(resultsPath, 'utf-8');
      resultsData = JSON.parse(resultsRaw);
    } catch {
      resultsData = {};
    }

    // Build attempt object
    const existingAttempts = resultsData[username] || [];
    const attemptNumber = existingAttempts.length + 1;
    const attemptId = randomUUID();

    const attempt: Attempt = {
      attemptId,
      attemptNumber,
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
      totalScore: Math.round(totalScore * 10) / 10,
      percentage,
      passed,
    };

    // Append attempt
    resultsData[username] = [...existingAttempts, attempt];

    // REPLACE: await kv.set('results', JSON.stringify(resultsData));
    fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      attemptId,
      scores: {
        mcqScore,
        shortScore: attempt.shortScore,
        caseScore: attempt.caseScore,
        totalScore: attempt.totalScore,
        percentage,
        passed,
      },
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
