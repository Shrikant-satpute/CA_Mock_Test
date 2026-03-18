// =============================================================================
// GET /api/result?username=...&attemptId=...
// Returns attempt data + full questions for result display
//
// ⚠️ VERCEL DEPLOYMENT NOTE:
// Replace fs.readFileSync with KV/DB reads as noted in submit/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import type { ResultsData, QuestionsData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const attemptId = searchParams.get('attemptId');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Load results
    const resultsPath = path.join(process.cwd(), 'data', 'results.json');
    let resultsData: ResultsData = {};
    try {
      const raw = fs.readFileSync(resultsPath, 'utf-8');
      resultsData = JSON.parse(raw);
    } catch {
      resultsData = {};
    }

    const userAttempts = resultsData[username] || [];
    if (userAttempts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No attempts found' },
        { status: 404 }
      );
    }

    let attempt;
    if (attemptId) {
      attempt = userAttempts.find((a) => a.attemptId === attemptId);
    } else {
      attempt = userAttempts[userAttempts.length - 1];
    }

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Load questions for display
    const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
    const questionsRaw = fs.readFileSync(questionsPath, 'utf-8');
    const questions: QuestionsData = JSON.parse(questionsRaw);

    return NextResponse.json({
      success: true,
      attempt,
      questions,
      totalAttempts: userAttempts.length,
    });
  } catch (error) {
    console.error('Result error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
