"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

type Question = { id: string; question_text: string; options: string[] };
type Category  = { id: string; name: string; slug: string };
type QuizState = "loading" | "pick-category" | "ready" | "question" | "submitting" | "error";

const TIMER_SECONDS = 45;

function QuizInner() {
  const params       = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const applicantId = searchParams.get("aid") ?? null;
  const jobId       = searchParams.get("job") ?? null;

  const [state, setState]               = useState<QuizState>("loading");
  const [categories, setCategories]     = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [sessionId, setSessionId]       = useState<string>("");
  const [roleName, setRoleName]         = useState<string>("");
  const [current, setCurrent]           = useState(0);
  const [answers, setAnswers]           = useState<number[]>([]);
  const [answerTimes, setAnswerTimes]   = useState<number[]>([]);
  const [selected, setSelected]         = useState<number | null>(null);
  const [timeLeft, setTimeLeft]         = useState(TIMER_SECONDS);
  const [error, setError]               = useState("");

  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabRef           = useRef(0);
  const submittingRef    = useRef(false);
  const questionStartRef = useRef<number>(0);

  const startQuiz = useCallback(
    async (category: Category | null) => {
      setState("loading");
      try {
        const body: Record<string, string> = { role_slug: params.role };
        if (category)    body.category_slug = category.slug;
        if (applicantId) body.applicant_id  = applicantId;
        if (jobId)       body.job_id        = jobId;
        const res = await fetch("/api/quiz/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || `Server error ${res.status}`);
          setState("error");
          return;
        }
        const data = await res.json();
        setQuestions(data.questions);
        setSessionId(data.session_id);
        setRoleName(data.role.name);
        setState("ready");
      } catch (err) {
        setError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
        setState("error");
      }
    },
    [params.role, applicantId, jobId]
  );

  useEffect(() => {
    async function init() {
      // If applying to a specific job, skip category picker — job determines category
      if (jobId) { startQuiz(null); return; }
      try {
        const res = await fetch(`/api/quiz/categories?role=${params.role}`);
        if (!res.ok) { startQuiz(null); return; }
        const data = await res.json();
        const cats: Category[] = data.categories ?? [];
        setCategories(cats);
        if (cats.length > 0) setState("pick-category");
        else startQuiz(null);
      } catch {
        startQuiz(null);
      }
    }
    init();
  }, [params.role, startQuiz, jobId]);

  const submitQuiz = useCallback(
    async (finalAnswers: number[], finalTimes: number[], forceFail = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setState("submitting");
      try {
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            answers: finalAnswers,
            answer_times: finalTimes,
            tab_switches: tabRef.current,
            force_fail: forceFail,
          }),
        });
        const data = await res.json();
        const passUrl = `/${params.role}/pass?sid=${sessionId}${applicantId ? `&aid=${applicantId}` : ""}`;
        if (data.passed) router.push(passUrl);
        else router.push(`/${params.role}/fail`);
      } catch {
        submittingRef.current = false;
        setState("error");
        setError("Network error — please check your connection and try again.");
      }
    },
    [sessionId, params.role, applicantId, router]
  );

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    questionStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const elapsed = (Date.now() - questionStartRef.current) / 1000;
          setAnswerTimes((prevTimes) => {
            const nextTimes = [...prevTimes, elapsed];
            setAnswers((prev) => {
              const next = [...prev, -1];
              setCurrent((c) => {
                const nextIdx = c + 1;
                if (nextIdx >= questions.length) submitQuiz(next, nextTimes);
                else { setSelected(null); setTimeout(startTimer, 50); }
                return nextIdx;
              });
              return next;
            });
            return nextTimes;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [questions.length, submitQuiz]);

  useEffect(() => {
    if (state !== "question") return;
    const handle = () => {
      if (document.visibilityState === "hidden") {
        tabRef.current += 1;
        if (timerRef.current) clearInterval(timerRef.current);
        submitQuiz(answers, answerTimes, true);
      }
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [state, answers, answerTimes, submitQuiz]);

  useEffect(() => {
    if (state !== "question") return;
    const block = () => history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", block);
    history.pushState(null, "", window.location.href);
    return () => window.removeEventListener("popstate", block);
  }, [state]);

  function beginQuiz() { setState("question"); startTimer(); }

  function handleSelect(idx: number) {
    if (selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed  = (Date.now() - questionStartRef.current) / 1000;
    setSelected(idx);
    const newAnswers = [...answers, idx];
    const newTimes   = [...answerTimes, elapsed];
    setAnswers(newAnswers);
    setAnswerTimes(newTimes);
    setTimeout(() => {
      const nextIdx = current + 1;
      if (nextIdx >= questions.length) submitQuiz(newAnswers, newTimes);
      else { setCurrent(nextIdx); setSelected(null); startTimer(); }
    }, 600);
  }

  function blockAction(e: React.SyntheticEvent) { e.preventDefault(); }

  if (state === "loading") return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-brand-text-tertiary">Loading...</p>
    </div>
  );

  if (state === "error") return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-red-400 mb-4">{error}</p>
      {answers.length > 0 && (
        <button
          onClick={() => {
            setError("");
            setState("question");
            submittingRef.current = false;
            // Re-submit with current answers
            submitQuiz(answers, answerTimes);
          }}
          className="btn-primary px-8 py-3 mt-4"
        >
          Retry submission →
        </button>
      )}
      <div className="mt-4">
        <a href="/" className="text-brand-orange underline">← Back to roles</a>
      </div>
    </div>
  );

  if (state === "submitting") return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-brand-text-tertiary">Submitting your answers...</p>
    </div>
  );

  if (state === "pick-category") return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="section-label mb-2">Choose your specialisation</p>
      <h1 className="text-fluid-heading font-bold text-white mb-3">What is your focus area?</h1>
      <p className="text-brand-text-secondary mb-8 text-sm">
        Your quiz will include 5 core questions + 5 questions specific to your specialisation.
      </p>
      <div className="grid gap-3 text-left">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat); startQuiz(cat); }}
            className="w-full text-left card hover:border-brand-orange hover:bg-brand-black-card px-6 py-4 text-white font-medium transition-all duration-150"
          >
            <span className="text-brand-orange font-bold mr-3">→</span>{cat.name}
          </button>
        ))}
      </div>
    </div>
  );

  if (state === "ready") return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="section-label mb-2">
        {roleName}{selectedCategory ? ` · ${selectedCategory.name}` : ""}
      </p>
      <h1 className="text-fluid-heading font-bold text-white mb-4">Ready to start?</h1>
      <p className="text-brand-text-secondary mb-2">10 questions · 45 seconds each · no going back</p>
      <p className="text-brand-text-secondary mb-8 text-sm">Switching tabs will immediately end your attempt.</p>
      <button onClick={beginQuiz} className="btn-primary px-10 py-4 text-lg">
        Start Quiz
      </button>
    </div>
  );

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 select-none" onContextMenu={blockAction} onCopy={blockAction} onCut={blockAction} onPaste={blockAction}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-brand-text-muted text-sm">Question {current + 1} of {questions.length}</span>
      </div>

      {/* Circular timer */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1e1e1e" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={timeLeft <= 10 ? "#ef4444" : "#f97316"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / TIMER_SECONDS)}`}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold tabular-nums ${timeLeft <= 10 ? "text-red-400" : "text-brand-orange"}`}>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <p className="text-white text-lg font-medium leading-relaxed">{q.question_text}</p>
      </div>

      <div className="grid gap-3">
        {q.options.map((option, idx) => {
          let style = "w-full text-left card px-5 py-4 text-brand-text-body text-sm font-medium transition-colors duration-150 cursor-pointer";
          if (selected !== null) {
            style += idx === selected ? " border-brand-orange bg-brand-black-card text-white" : " opacity-40 cursor-not-allowed";
          } else {
            style += " hover:border-brand-orange hover:bg-brand-black-card hover:text-white";
          }
          return (
            <button key={idx} className={style} onClick={() => handleSelect(idx)} disabled={selected !== null}>
              <span className="text-brand-orange font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return <Suspense><QuizInner /></Suspense>;
}
