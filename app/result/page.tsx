'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Attempt, QuestionsData, MCQQuestion, ShortQuestion, CaseQuestion } from '@/lib/types';

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start * 10) / 10);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function ScoreCircle({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill="none" stroke="#1e1e2e" strokeWidth="8" />
      <circle
        cx="60" cy="60" r="54" fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.5s ease' }}
      />
    </svg>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMCQDetail, setShowMCQDetail] = useState(true);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const animScore = useCountUp(attempt?.totalScore || 0);
  const animPct = useCountUp(attempt?.percentage || 0);

  useEffect(() => {
    const raw = localStorage.getItem('ca_session');
    if (!raw) { router.push('/'); return; }
    const session = JSON.parse(raw);
    if (!session.loggedIn || session.role === 'admin') { router.push('/'); return; }

    const attemptId = localStorage.getItem('ca_last_attempt') || '';
    const url = `/api/result?username=${encodeURIComponent(session.username)}${attemptId ? `&attemptId=${attemptId}` : ''}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAttempt(data.attempt);
          setQuestions(data.questions);
          setTotalAttempts(data.totalAttempts);
        } else {
          setError(data.error || 'Failed to load results');
        }
      })
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('ca_session');
    localStorage.removeItem('ca_last_attempt');
    router.push('/');
  };

  const handleTakeAgain = () => {
    localStorage.removeItem('ca_last_attempt');
    router.push('/exam');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#94a3b8] text-sm">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt || !questions) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-[#ef4444] font-semibold">{error || 'Result not found'}</p>
          <button onClick={() => router.push('/exam')} className="btn-primary mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
            Go to Exam
          </button>
        </div>
      </div>
    );
  }

  const qMap = {
    mcq: Object.fromEntries(questions.mcq.map(q => [q.id, q])) as Record<number, MCQQuestion>,
    short: Object.fromEntries(questions.short.map(q => [q.id, q])) as Record<number, ShortQuestion>,
    case: Object.fromEntries(questions.case.map(q => [q.id, q])) as Record<number, CaseQuestion>,
  };

  const submittedDate = new Date(attempt.submittedAt).toLocaleString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid pb-12">
      {/* Navbar */}
      <header className="glass border-b border-[#1e1e2e] px-4 md:px-8 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342" />
            </svg>
          </div>
          <span className="font-bold text-sm">Result</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTakeAgain} className="btn-primary px-3 py-1.5 rounded-lg text-white font-medium text-xs">
            Take Again
          </button>
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg border border-[#1e1e2e] text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-medium transition-colors">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        {/* Hero score section */}
        <div className="fade-in glass rounded-2xl p-8 border border-[#1e1e2e] mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: attempt.passed ? 'radial-gradient(circle at center, #10b981, transparent)' : 'radial-gradient(circle at center, #ef4444, transparent)' }} />

          <div className="relative z-10">
            <div className="relative inline-flex items-center justify-center mb-4">
              <ScoreCircle score={attempt.totalScore} max={55} color={attempt.passed ? '#10b981' : '#ef4444'} />
              <div className="absolute text-center">
                <div className="text-3xl font-black" style={{ color: attempt.passed ? '#10b981' : '#ef4444' }}>
                  {animScore.toFixed(1)}
                </div>
                <div className="text-xs text-[#94a3b8] font-medium">/ 55</div>
              </div>
            </div>

            <div className="text-4xl font-black text-[#f1f5f9] mb-1">{animScore.toFixed(1)} <span className="text-xl text-[#94a3b8] font-normal">/ 55</span></div>
            <div className="text-xl text-[#94a3b8] mb-3">{animPct.toFixed(1)}%</div>

            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-lg ${attempt.passed ? 'bg-[#10b981]/20 text-[#10b981] pass-glow' : 'bg-[#ef4444]/20 text-[#ef4444] fail-glow'}`}>
              {attempt.passed ? '✅ PASSED' : '❌ FAILED'}
            </div>

            <div className="mt-4 text-sm text-[#94a3b8]">
              Attempt #{attempt.attemptNumber} · Submitted: {submittedDate}
            </div>
          </div>
        </div>

        {/* Section-wise score cards */}
        <div className="grid grid-cols-3 gap-4 mb-6 fade-in stagger-2">
          {[
            { label: 'Section A', sub: 'MCQ', score: attempt.mcqScore, max: 20, color: '#6366f1', bg: '#6366f1' },
            { label: 'Section B', sub: 'Short', score: attempt.shortScore, max: 20, color: '#f59e0b', bg: '#f59e0b' },
            { label: 'Section C', sub: 'Case', score: attempt.caseScore, max: 15, color: '#a855f7', bg: '#a855f7' },
          ].map(({ label, sub, score, max, color, bg }) => (
            <div key={label} className="glass rounded-xl p-4 border border-[#1e1e2e] text-center" style={{ borderTop: `2px solid ${color}` }}>
              <div className="text-xs text-[#94a3b8] mb-1">{label}</div>
              <div className="text-xl font-bold" style={{ color }}>{score}</div>
              <div className="text-xs text-[#94a3b8]">/ {max}</div>
              <div className="text-xs text-[#4a5568] mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Section A Review */}
        <div className="mb-6 fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#6366f1]/20 text-[#6366f1] text-xs font-bold flex items-center justify-center">A</span>
              Section A — MCQ Review
            </h3>
            <button
              onClick={() => setShowMCQDetail(!showMCQDetail)}
              className="text-xs text-[#6366f1] hover:text-indigo-300 font-medium"
            >
              {showMCQDetail ? 'Hide All' : 'Show All'}
            </button>
          </div>

          {showMCQDetail && (
            <div className="space-y-3">
              {attempt.mcqResults.map((r, idx) => {
                const q = qMap.mcq[r.questionId];
                if (!q) return null;
                return (
                  <div key={r.questionId} className={`glass rounded-xl p-4 border ${r.isCorrect ? 'border-[#10b981]/30' : 'border-[#ef4444]/30'}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm text-[#f1f5f9] font-medium flex-1">
                        <span className="text-[#94a3b8] mr-2">{idx + 1}.</span>
                        {q.question}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${r.isCorrect ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                        {r.isCorrect ? '+1' : '0'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded-lg ${r.userAnswer === r.correctAnswer ? 'bg-[#10b981]/10 border border-[#10b981]/30' : 'bg-[#ef4444]/10 border border-[#ef4444]/30'}`}>
                        <span className="text-[#94a3b8]">Your answer: </span>
                        <span className={r.userAnswer === r.correctAnswer ? 'text-[#10b981] font-semibold' : 'text-[#ef4444] font-semibold'}>
                          {r.userAnswer || '—'}{r.userAnswer && `. ${q.options[r.userAnswer as keyof typeof q.options]}`}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
                        <span className="text-[#94a3b8]">Correct: </span>
                        <span className="text-[#10b981] font-semibold">
                          {r.correctAnswer}. {q.options[r.correctAnswer as keyof typeof q.options]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section B Review */}
        <div className="mb-6 fade-in stagger-4">
          <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold flex items-center justify-center">B</span>
            Section B — Short Answer Review
          </h3>
          <div className="space-y-4">
            {attempt.shortResults.map((r, idx) => {
              const q = qMap.short[r.questionId];
              if (!q) return null;
              return (
                <div key={r.questionId} className="glass rounded-xl p-5 border border-[#f59e0b]/20">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm text-[#f1f5f9] font-medium flex-1">
                      <span className="text-[#94a3b8] mr-2">{idx + 1}.</span>
                      {q.question}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] font-bold shrink-0">
                      {r.marksAwarded}/{r.maxMarks}
                    </span>
                  </div>

                  {/* Keywords matched */}
                  <div className="mb-3">
                    <span className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Keywords matched: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.keywordsMatched.length > 0
                        ? r.keywordsMatched.map(kw => (
                            <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">{kw}</span>
                          ))
                        : <span className="text-xs text-[#4a5568]">None matched</span>
                      }
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1">{r.keywordsMatched.length}/{r.totalKeywords} keywords</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
                      <p className="text-xs font-semibold text-[#94a3b8] mb-2 uppercase tracking-wider">Your Answer</p>
                      <p className="text-sm text-[#f1f5f9] whitespace-pre-line">{r.userAnswer || <span className="text-[#4a5568] italic">No answer provided</span>}</p>
                    </div>
                    <div className="bg-[#10b981]/5 rounded-xl p-3 border border-[#10b981]/20">
                      <p className="text-xs font-semibold text-[#10b981] mb-2 uppercase tracking-wider">Model Answer</p>
                      <p className="text-sm text-[#94a3b8] whitespace-pre-line">{r.modelAnswer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section C Review */}
        <div className="mb-8 fade-in stagger-5">
          <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center">C</span>
            Section C — Case Based Review
          </h3>
          <div className="space-y-4">
            {attempt.caseResults.map((r, idx) => {
              const q = qMap.case[r.questionId];
              if (!q) return null;
              return (
                <div key={r.questionId} className="glass rounded-xl p-5 border border-purple-500/20">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm text-[#f1f5f9] font-medium flex-1">
                      <span className="text-[#94a3b8] mr-2">{idx + 1}.</span>
                      Case {idx + 1}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold shrink-0">
                      {r.marksAwarded}/{r.maxMarks}
                    </span>
                  </div>

                  <blockquote className="bg-[#1e1e2e]/60 border-l-2 border-purple-500 rounded-r-xl px-3 py-2 mb-3 text-xs text-[#94a3b8] italic">
                    {r.caseScenario || q.caseScenario}
                  </blockquote>
                  <p className="text-sm text-[#f1f5f9] font-medium mb-3">{q.question}</p>

                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {r.keywordsMatched.map(kw => (
                        <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">{kw}</span>
                      ))}
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1">{r.keywordsMatched.length}/{r.totalKeywords} keywords matched</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
                      <p className="text-xs font-semibold text-[#94a3b8] mb-2 uppercase tracking-wider">Your Answer</p>
                      <p className="text-sm text-[#f1f5f9] whitespace-pre-line">{r.userAnswer || <span className="text-[#4a5568] italic">No answer provided</span>}</p>
                    </div>
                    <div className="bg-[#10b981]/5 rounded-xl p-3 border border-[#10b981]/20">
                      <p className="text-xs font-semibold text-[#10b981] mb-2 uppercase tracking-wider">Model Answer</p>
                      <p className="text-sm text-[#94a3b8] whitespace-pre-line">{r.modelAnswer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleTakeAgain}
            className="btn-primary px-8 py-3.5 rounded-xl text-white font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Take Again
          </button>
          <button
            onClick={handleLogout}
            className="px-8 py-3.5 rounded-xl border border-[#1e1e2e] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#6366f1]/50 font-semibold transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
