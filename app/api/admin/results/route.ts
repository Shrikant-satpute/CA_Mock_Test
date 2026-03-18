// =============================================================================
// GET /api/admin/results
// Reads from Vercel KV (production) or /data/results.json (local dev)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { ResultsData, AdminAttemptRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

async function readQuestions() {
  const fs = await import('fs');
  const path = await import('path');
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'questions.json'), 'utf-8');
  return JSON.parse(raw);
}

export async function GET(request: NextRequest) {
  try {
    const resultsData = await readResults();

    // Flatten all attempts with username
    const allAttempts: AdminAttemptRow[] = [];
    for (const [username, attempts] of Object.entries(resultsData)) {
      for (const attempt of attempts) {
        allAttempts.push({ ...attempt, username });
      }
    }

    // Sort by submittedAt descending
    allAttempts.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    const uniqueStudents = new Set(allAttempts.map((a) => a.username)).size;
    const totalAttempts = allAttempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round((allAttempts.reduce((sum, a) => sum + a.totalScore, 0) / totalAttempts) * 10) / 10
      : 0;
    const highestScore = totalAttempts > 0
      ? Math.max(...allAttempts.map((a) => a.totalScore))
      : 0;

    const questions = await readQuestions();

    return NextResponse.json({
      success: true,
      attempts: allAttempts,
      stats: { totalAttempts, uniqueStudents, avgScore, highestScore },
      questions,
    });
  } catch (error) {
    console.error('Admin results error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
