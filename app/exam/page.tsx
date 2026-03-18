'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { QuestionsData } from '@/lib/types';

// 60 minutes in seconds
const EXAM_DURATION = 60 * 60;

// Target exam start: March 19, 2026 at 23:00 IST (UTC+5:30 = 17:30 UTC)
const EXAM_START_TIME = new Date('2026-03-19T17:30:00.000Z');

const EXAM_JOKES = [
  { emoji: '😅', joke: 'Why did the CA student stare at the orange juice carton?', punchline: 'Because it said "concentrate"! 🧃' },
  { emoji: '📚', joke: 'What\'s a CA student\'s favourite exercise?', punchline: 'Running... from deadlines! 🏃' },
  { emoji: '🤓', joke: 'Why don\'t CA students look out the window in the morning?', punchline: 'Because then they\'d have nothing to do in the afternoon! 😂' },
  { emoji: '💸', joke: 'What did Section 197 say to the director?', punchline: '"I\'m watching your remuneration!" 👀' },
  { emoji: '☕', joke: 'A CA student\'s diet consists of 3 food groups:', punchline: 'Coffee, stress, and more coffee! ☕☕☕' },
  { emoji: '🎓', joke: 'Why did the student bring a ladder to the exam?', punchline: 'Because it was a high-level paper! 📈' },
  { emoji: '😴', joke: 'What\'s the difference between a CA student and a pizza?', punchline: 'A pizza can feed a family of four! 🍕' },
  { emoji: '📖', joke: 'How many CA students does it take to change a lightbulb?', punchline: 'Just one — but they\'ll spend 3 hours auditing whether it really needed changing! 🔦' },
  { emoji: '🧠', joke: 'Why is Schedule V like a gym?', punchline: 'Both have limits... and both make directors cry! 😭' },
  { emoji: '📝', joke: 'What\'s a CA student\'s favourite movie?', punchline: '"Gone in 60 Minutes" — exactly the exam duration! ⏱️' },
  { emoji: '💡', joke: 'Teacher: "What is 11% of net profits?"', punchline: 'Student: "The reason I haven\'t slept in 3 days!" 😩' },
  { emoji: '🎯', joke: 'Why did the director get nervous before the AGM?', punchline: 'Because his remuneration was about to face a Special Resolution! 🗳️' },
];

function formatCountdown(ms: number) {
  if (ms <= 0) return { h: '00', m: '00', s: '00', total: 0 };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    total,
  };
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function DifficultyBadge({ d }: { d: string }) {
  const map: Record<string, string> = {
    medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    scenario: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[d] || map.medium}`}>
      {d.charAt(0).toUpperCase() + d.slice(1)}
    </span>
  );
}

// ─── Pre-Exam Countdown Screen ────────────────────────────────────────────────
function CountdownScreen({ username, onStart }: { username: string; onStart: () => void }) {
  const [msLeft, setMsLeft] = useState(() => EXAM_START_TIME.getTime() - Date.now());
  const [jokeIndex, setJokeIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [jokeVisible, setJokeVisible] = useState(true);
  const startedRef = useRef(false);

  // Countdown tick
  useEffect(() => {
    const tick = setInterval(() => {
      const left = EXAM_START_TIME.getTime() - Date.now();
      setMsLeft(left);
      if (left <= 0 && !startedRef.current) {
        startedRef.current = true;
        clearInterval(tick);
        setTimeout(onStart, 800); // brief pause then auto-open instructions
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [onStart]);

  // Rotate jokes every 8 seconds
  useEffect(() => {
    const jokeTimer = setInterval(() => {
      setJokeVisible(false);
      setShowPunchline(false);
      setTimeout(() => {
        setJokeIndex(i => (i + 1) % EXAM_JOKES.length);
        setJokeVisible(true);
      }, 500);
    }, 8000);
    return () => clearInterval(jokeTimer);
  }, []);

  // Show punchline after 3s of joke
  useEffect(() => {
    setShowPunchline(false);
    const t = setTimeout(() => setShowPunchline(true), 3000);
    return () => clearTimeout(t);
  }, [jokeIndex]);

  const cd = formatCountdown(msLeft);
  const isNearStart = cd.total > 0 && cd.total <= 300; // last 5 minutes
  const joke = EXAM_JOKES[jokeIndex];

  // Already past start time — immediately trigger
  if (msLeft <= 0 && !startedRef.current) {
    startedRef.current = true;
    setTimeout(onStart, 100);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] bg-grid flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '-10%', left: '-10%', animation: 'orb1 14s ease-in-out infinite' }} />
      <div className="absolute w-96 h-96 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', bottom: '-5%', right: '-5%', animation: 'orb2 16s ease-in-out infinite' }} />

      {/* Header */}
      <div className="text-center mb-8 fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#6366f1] text-xs font-semibold mb-4 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          Exam Starts Soon
        </div>
        <h1 className="text-2xl md:text-3xl font-black gradient-text mb-1">CA Exam Portal</h1>
        <p className="text-[#94a3b8] text-sm">Chapter 3 — Remuneration to Directors</p>
        <p className="text-[#6366f1] text-sm mt-1">Welcome, <span className="font-bold">{username}</span> 👋</p>
      </div>

      {/* Countdown clock */}
      <div className={`mb-8 fade-in stagger-2 ${isNearStart ? 'timer-pulse' : ''}`}>
        <p className="text-center text-xs text-[#94a3b8] uppercase tracking-widest mb-3 font-semibold">
          Exam opens at 11:00 PM · March 19, 2026
        </p>
        <div className="flex items-center gap-2 md:gap-4">
          {[
            { label: 'Hours', value: cd.h },
            { label: 'Minutes', value: cd.m },
            { label: 'Seconds', value: cd.s },
          ].map(({ label, value }, i) => (
            <div key={label} className="flex items-center gap-2 md:gap-4">
              {i > 0 && (
                <span className={`text-3xl md:text-5xl font-black pb-4 ${isNearStart ? 'text-[#ef4444]' : 'text-[#6366f1]'}`}>:</span>
              )}
              <div className="text-center">
                <div
                  className="glass rounded-2xl px-5 md:px-8 py-4 md:py-5 border"
                  style={{ borderColor: isNearStart ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)', boxShadow: isNearStart ? '0 0 20px rgba(239,68,68,0.2)' : '0 0 20px rgba(99,102,241,0.1)' }}
                >
                  <span
                    key={value}
                    className={`text-4xl md:text-6xl font-black tabular-nums block`}
                    style={{ color: isNearStart ? '#ef4444' : '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {value}
                  </span>
                </div>
                <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mt-2">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {isNearStart && (
          <p className="text-center text-[#ef4444] text-sm font-bold mt-3 animate-pulse">
            🔥 Almost time! Get ready...
          </p>
        )}
        {!isNearStart && (
          <p className="text-center text-[#4a5568] text-xs mt-3">
            The exam will begin automatically when the timer hits zero
          </p>
        )}
      </div>

      {/* Joke card */}
      <div
        className="w-full max-w-lg fade-in stagger-3"
        style={{ opacity: jokeVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        <div className="glass rounded-2xl p-6 border border-[#1e1e2e] relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 right-0 text-6xl opacity-10 pointer-events-none select-none pr-4 pt-2">
            {joke.emoji}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 font-semibold uppercase tracking-wider">
              😂 While You Wait
            </span>
          </div>

          <p className="text-[#f1f5f9] font-semibold text-sm md:text-base mb-3 leading-relaxed">
            {joke.joke}
          </p>

          <div
            className="overflow-hidden"
            style={{
              maxHeight: showPunchline ? '100px' : '0',
              opacity: showPunchline ? 1 : 0,
              transition: 'all 0.6s ease',
            }}
          >
            <div className="pt-1 border-t border-[#1e1e2e]">
              <p className="text-[#f59e0b] font-bold text-sm md:text-base mt-2 leading-relaxed">
                {joke.punchline}
              </p>
            </div>
          </div>

          {!showPunchline && (
            <p className="text-[#4a5568] text-xs italic mt-2">punchline incoming...</p>
          )}

          {/* Joke dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {EXAM_JOKES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === jokeIndex ? '20px' : '6px',
                  height: '6px',
                  background: i === jokeIndex ? '#f59e0b' : '#1e1e2e',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Exam info strip */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#4a5568] fade-in stagger-4">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
          28 Questions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
          55 Marks Total
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          60 Minutes Duration
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Pass: 22/55 (40%)
        </span>
      </div>
    </div>
  );
}

// ─── Main Exam Page ────────────────────────────────────────────────────────────
export default function ExamPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [questions, setQuestions] = useState<QuestionsData | null>(null);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C'>('A');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [caseAnswers, setCaseAnswers] = useState<Record<string, string>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem('ca_session');
    if (!raw) { router.push('/'); return; }
    const s = JSON.parse(raw);
    if (!s.loggedIn) { router.push('/'); return; }
    if (s.role === 'admin') { router.push('/admin'); return; }
    setSession(s);

    fetch('/api/questions')
      .then(r => r.json())
      .then(d => { if (d.mcq) setQuestions(d); })
      .catch(() => {});
  }, [router]);

  const handleCountdownEnd = useCallback(() => {
    setShowCountdown(false);
    setShowInstructions(true);
  }, []);

  const submitExam = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const raw = localStorage.getItem('ca_session');
      const username = raw ? JSON.parse(raw).username : '';

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, mcqAnswers, shortAnswers, caseAnswers }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('ca_last_attempt', data.attemptId);
          router.push('/result');
        }
      } catch (e) {
        console.error(e);
        setSubmitting(false);
        submittedRef.current = false;
      }
    },
    [mcqAnswers, shortAnswers, caseAnswers, router]
  );

  useEffect(() => {
    if (!examStarted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimeUp(true);
          setTimeout(() => submitExam(true), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examStarted, submitExam]);

  if (!session || !questions) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#94a3b8] text-sm">Loading exam...</p>
        </div>
      </div>
    );
  }

  const timerColor =
    timeLeft <= 120
      ? 'text-[#ef4444]'
      : timeLeft <= 300
      ? 'text-[#f59e0b]'
      : 'text-[#f1f5f9]';
  const timerPulse = timeLeft <= 120 && examStarted;

  const answeredMCQ = Object.keys(mcqAnswers).length;
  const answeredShort = Object.keys(shortAnswers).filter(k => shortAnswers[k].trim()).length;
  const answeredCase = Object.keys(caseAnswers).filter(k => caseAnswers[k].trim()).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid">
      {/* Pre-exam countdown */}
      {showCountdown && (
        <CountdownScreen username={session.username} onStart={handleCountdownEnd} />
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border border-[#1e1e2e]"
            style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
            <div className="text-center mb-6">
              <span className="text-4xl">📋</span>
              <h2 className="text-2xl font-bold text-[#f1f5f9] mt-2">Examination Instructions</h2>
              <p className="text-[#6366f1] text-sm mt-1">Welcome, <span className="font-semibold">{session.username}</span></p>
            </div>

            {/* Marks table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    <th className="text-left py-2 px-3 text-[#94a3b8] font-semibold">Section</th>
                    <th className="text-center py-2 px-3 text-[#94a3b8] font-semibold">Questions</th>
                    <th className="text-center py-2 px-3 text-[#94a3b8] font-semibold">Marks Each</th>
                    <th className="text-center py-2 px-3 text-[#94a3b8] font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Section A – MCQ', '20', '1 mark', '20 marks'],
                    ['Section B – Short Answer', '5', '4 marks', '20 marks'],
                    ['Section C – Case Based', '3', '5 marks', '15 marks'],
                  ].map(([sec, q, m, t]) => (
                    <tr key={sec} className="border-b border-[#1e1e2e]/50">
                      <td className="py-2.5 px-3 text-[#f1f5f9] font-medium">{sec}</td>
                      <td className="py-2.5 px-3 text-center text-[#94a3b8]">{q}</td>
                      <td className="py-2.5 px-3 text-center text-[#94a3b8]">{m}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#6366f1]">{t}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#6366f1]/5">
                    <td className="py-2.5 px-3 font-bold text-[#f1f5f9]">Total</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#f1f5f9]">28</td>
                    <td className="py-2.5 px-3 text-center text-[#94a3b8]">—</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#f59e0b]">55 marks</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-xl px-4 py-3 mb-6 text-center">
              <span className="text-[#6366f1] font-bold text-lg">⏱ Duration: 60 Minutes</span>
              <span className="text-[#94a3b8] text-sm ml-3">| Passing: 22/55 (40%)</span>
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Instructions</h3>
              {[
                'The exam will begin as soon as you click "Start Exam"',
                'Timer cannot be paused once started',
                'Paper auto-submits when timer reaches zero',
                'For MCQ: select one answer only',
                'For Short and Case answers: write in your own words',
                'Passing marks: 22 out of 55 (40%)',
                'All previous attempts are saved and visible to admin',
              ].map((inst, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-[#94a3b8]">
                  <span className="w-5 h-5 rounded-full bg-[#6366f1]/20 text-[#6366f1] text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i + 1}</span>
                  <span>{inst}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setShowInstructions(false); setExamStarted(true); }}
              className="btn-primary w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
              style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
            >
              🚀 Start Exam
            </button>
          </div>
        </div>
      )}

      {/* Time up overlay */}
      {timeUp && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-[#ef4444] mb-2">Time&apos;s Up!</h2>
            <p className="text-[#94a3b8]">Submitting your paper...</p>
            <div className="mt-4 w-12 h-12 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && !timeUp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#f1f5f9] font-semibold">Submitting your paper...</p>
            <p className="text-[#94a3b8] text-sm mt-1">Please wait</p>
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-md p-8 border border-[#1e1e2e]">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📤</div>
              <h3 className="text-xl font-bold text-[#f1f5f9]">Submit Paper?</h3>
              <p className="text-[#94a3b8] text-sm mt-2">This action cannot be undone.</p>
            </div>

            {(questions.mcq.length - answeredMCQ > 0 || questions.short.length - answeredShort > 0 || questions.case.length - answeredCase > 0) && (
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl px-4 py-3 mb-6 text-sm text-[#f59e0b]">
                ⚠️ Unanswered: {questions.mcq.length - answeredMCQ} MCQ, {questions.short.length - answeredShort} Short, {questions.case.length - answeredCase} Case
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="py-3 rounded-xl border border-[#1e1e2e] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#6366f1]/50 transition-all font-medium text-sm"
              >
                Continue Exam
              </button>
              <button
                onClick={() => { setShowSubmitModal(false); submitExam(false); }}
                className="btn-primary py-3 rounded-xl text-white font-semibold text-sm"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 glass border-b border-[#1e1e2e] px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342" />
            </svg>
          </div>
          <span className="font-bold text-sm hidden sm:block">CA Exam Portal</span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl glass-light ${timerPulse ? 'timer-pulse' : ''}`}>
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className={`font-mono font-bold text-lg ${timerColor} transition-colors duration-1000`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={!examStarted}
          className="btn-primary px-4 py-2 rounded-xl text-white font-semibold text-sm disabled:opacity-40"
        >
          Submit Paper
        </button>
      </header>

      <div className="flex">
        {/* Sidebar – desktop */}
        <aside className="hidden lg:block w-56 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-[#1e1e2e] p-4">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Sections</p>
          {(['A', 'B', 'C'] as const).map((sec) => {
            const labels: Record<string, string> = { A: 'Section A — MCQ', B: 'Section B — Short', C: 'Section C — Case' };
            const counts: Record<string, number> = { A: answeredMCQ, B: answeredShort, C: answeredCase };
            const totals: Record<string, number> = { A: questions.mcq.length, B: questions.short.length, C: questions.case.length };
            const colors: Record<string, string> = { A: '#6366f1', B: '#f59e0b', C: '#a855f7' };
            const done = counts[sec];
            const total = totals[sec];
            return (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-2 transition-all text-sm font-medium ${activeSection === sec ? 'text-white' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}
                style={activeSection === sec ? { background: `${colors[sec]}20`, borderLeft: `3px solid ${colors[sec]}` } : { borderLeft: '3px solid transparent' }}
              >
                <div className="font-semibold">{labels[sec]}</div>
                <div className="text-xs mt-1 opacity-70">{done}/{total} answered</div>
                <div className="mt-2 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, background: colors[sec] }} />
                </div>
              </button>
            );
          })}

          <div className="mt-4 p-3 glass-light rounded-xl text-xs text-[#94a3b8]">
            <div className="font-semibold text-[#f1f5f9] mb-1">Progress</div>
            <div>{answeredMCQ + answeredShort + answeredCase} / 28 answered</div>
          </div>
        </aside>

        {/* Mobile tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-[#1e1e2e] flex">
          {(['A', 'B', 'C'] as const).map((sec) => {
            const labels: Record<string, string> = { A: 'MCQ', B: 'Short', C: 'Case' };
            const colors: Record<string, string> = { A: '#6366f1', B: '#f59e0b', C: '#a855f7' };
            return (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`flex-1 py-3 text-sm font-semibold transition-all ${activeSection === sec ? 'text-white' : 'text-[#94a3b8]'}`}
                style={activeSection === sec ? { borderTop: `2px solid ${colors[sec]}`, color: colors[sec] } : { borderTop: '2px solid transparent' }}
              >
                {labels[sec]}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6 max-w-4xl">
          {/* Section A – MCQ */}
          {activeSection === 'A' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 flex items-center justify-center">
                  <span className="text-[#6366f1] font-bold text-sm">A</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#f1f5f9]">Section A — Multiple Choice Questions</h2>
                  <p className="text-sm text-[#94a3b8]">20 questions × 1 mark = 20 marks</p>
                </div>
              </div>

              {questions.mcq.map((q, idx) => (
                <div key={q.id} className="glass rounded-xl p-5 border border-[#1e1e2e] card-hover section-a-border">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#6366f1]/20 text-[#6366f1] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {mcqAnswers[q.id] && (
                        <span className="text-[#10b981] text-xs">✓ Answered</span>
                      )}
                    </div>
                    <DifficultyBadge d={q.difficulty} />
                  </div>
                  <p className="text-[#f1f5f9] text-sm font-medium mb-4 leading-relaxed">{q.question}</p>
                  <div className="space-y-2.5">
                    {Object.entries(q.options).map(([key, val]) => (
                      <label
                        key={key}
                        className={`mcq-option flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                          mcqAnswers[q.id] === key ? 'selected border-[#6366f1]' : 'border-[#1e1e2e]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`mcq-${q.id}`}
                          value={key}
                          checked={mcqAnswers[q.id] === key}
                          onChange={() => setMcqAnswers(p => ({ ...p, [q.id]: key }))}
                          className="mt-0.5 accent-[#6366f1] shrink-0"
                        />
                        <span className="text-sm text-[#f1f5f9]">
                          <span className="font-semibold text-[#6366f1] mr-1">{key}.</span>
                          {val}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section B – Short Answer */}
          {activeSection === 'B' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                  <span className="text-[#f59e0b] font-bold text-sm">B</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#f1f5f9]">Section B — Short Answer Questions</h2>
                  <p className="text-sm text-[#94a3b8]">5 questions × 4 marks = 20 marks</p>
                </div>
              </div>

              {questions.short.map((q, idx) => (
                <div key={q.id} className="glass rounded-xl p-5 border border-[#1e1e2e] card-hover section-b-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {shortAnswers[q.id]?.trim() && (
                        <span className="text-[#10b981] text-xs">✓ Answered</span>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 font-medium">
                      4 Marks
                    </span>
                  </div>
                  <p className="text-[#f1f5f9] text-sm font-medium mb-4 leading-relaxed">{q.question}</p>
                  <div className="relative">
                    <textarea
                      value={shortAnswers[q.id] || ''}
                      onChange={e => setShortAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      placeholder="Write your answer here..."
                      rows={5}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#4a5568] transition-all duration-200"
                    />
                    <div className="text-xs text-[#4a5568] text-right mt-1">
                      {(shortAnswers[q.id] || '').length} chars
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section C – Case Based */}
          {activeSection === 'C' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 font-bold text-sm">C</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#f1f5f9]">Section C — Case Based Questions</h2>
                  <p className="text-sm text-[#94a3b8]">3 questions × 5 marks = 15 marks</p>
                </div>
              </div>

              {questions.case.map((q, idx) => (
                <div key={q.id} className="glass rounded-xl p-5 border border-[#1e1e2e] card-hover section-c-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {caseAnswers[q.id]?.trim() && (
                        <span className="text-[#10b981] text-xs">✓ Answered</span>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">
                      5 Marks
                    </span>
                  </div>

                  <blockquote className="bg-[#1e1e2e]/60 border-l-2 border-purple-500 rounded-r-xl px-4 py-3 mb-4 text-sm text-[#94a3b8] italic leading-relaxed">
                    <strong className="text-purple-400 not-italic text-xs uppercase tracking-wider block mb-1">Case Scenario</strong>
                    {q.caseScenario}
                  </blockquote>

                  <p className="text-[#f1f5f9] text-sm font-medium mb-4 leading-relaxed">{q.question}</p>
                  <div className="relative">
                    <textarea
                      value={caseAnswers[q.id] || ''}
                      onChange={e => setCaseAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      placeholder="Write your answer here..."
                      rows={6}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#4a5568] transition-all duration-200"
                    />
                    <div className="text-xs text-[#4a5568] text-right mt-1">
                      {(caseAnswers[q.id] || '').length} chars
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom submit bar */}
          <div className="mt-8 glass rounded-xl p-4 border border-[#1e1e2e] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-[#94a3b8] flex-wrap">
              <span><span className="text-[#6366f1] font-bold">{answeredMCQ}/{questions.mcq.length}</span> MCQ</span>
              <span><span className="text-[#f59e0b] font-bold">{answeredShort}/{questions.short.length}</span> Short</span>
              <span><span className="text-purple-400 font-bold">{answeredCase}/{questions.case.length}</span> Case</span>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={!examStarted}
              className="btn-primary px-8 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40"
            >
              Submit Paper
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
