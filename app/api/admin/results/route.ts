// =============================================================================
// GET /api/admin/results
// Returns ALL attempts for ALL users, sorted by submittedAt descending
//
// ⚠️ VERCEL DEPLOYMENT NOTE:
// Replace fs.readFileSync with KV/DB reads for persistent data on Vercel.
// Example with Vercel KV:
//   import { kv } from '@vercel/kv';
//   const resultsData = await kv.get('results') as ResultsData;
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import type { ResultsData, AdminAttemptRow } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const resultsPath = path.join(process.cwd(), 'data', 'results.json');
    let resultsData: ResultsData = {};
    try {
      const raw = fs.readFileSync(resultsPath, 'utf-8');
      resultsData = JSON.parse(raw);
    } catch {
      resultsData = {};
    }

    // Flatten all attempts with username
    const allAttempts: AdminAttemptRow[] = [];
    for (const [username, attempts] of Object.entries(resultsData)) {
      for (const attempt of attempts) {
        allAttempts.push({ ...attempt, username });
      }
    }

    // Sort by submittedAt descending
    allAttempts.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    // Stats
    const uniqueStudents = new Set(allAttempts.map((a) => a.username)).size;
    const totalAttempts = allAttempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            (allAttempts.reduce((sum, a) => sum + a.totalScore, 0) /
              totalAttempts) *
              10
          ) / 10
        : 0;
    const highestScore =
      totalAttempts > 0 ? Math.max(...allAttempts.map((a) => a.totalScore)) : 0;

    // Load questions for expanded detail display
    const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
    const questionsRaw = fs.readFileSync(questionsPath, 'utf-8');
    const questions = JSON.parse(questionsRaw);

    return NextResponse.json({
      success: true,
      attempts: allAttempts,
      stats: { totalAttempts, uniqueStudents, avgScore, highestScore },
      questions,
    });
  } catch (error) {
    console.error('Admin results error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
