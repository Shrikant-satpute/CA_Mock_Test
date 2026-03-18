import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
    const raw = fs.readFileSync(questionsPath, 'utf-8');
    const questions = JSON.parse(raw);
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
