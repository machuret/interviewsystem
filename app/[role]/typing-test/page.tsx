"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";

const PASSAGE = "The quick brown fox jumps over the lazy dog. Remote work requires focus, discipline, and clear communication with your team. Strong writing skills and fast typing help you stay efficient and professional. Practice every day to build speed and accuracy over time.";

const DURATION = 60;

function TypingTestInner() {
  const params       = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const applicantId = searchParams.get("aid") ?? null;

  const [phase, setPhase]           = useState<"intro" | "test" | "done">("intro");
  const [typed, setTyped]           = useState("");
  const [timeLeft, setTimeLeft]     = useState(DURATION);
  const [wpm, setWpm]               = useState(0);
  const [accuracy, setAccuracy]     = useState(0);
  const [saving, setSaving]         = useState(false);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef    = useRef<number>(0);
  const inputRef    = useRef<HTMLInputElement>(null);

  const finishTest = useCallback((finalTyped: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed    = (Date.now() - startRef.current) / 1000 / 60; // minutes
    const target     = PASSAGE.slice(0, finalTyped.length);
    let correct      = 0;
    for (let i = 0; i < finalTyped.length; i++) {
      if (finalTyped[i] === target[i]) correct++;
    }
    const totalChars  = finalTyped.length;
    const calcWpm     = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
    const calcAcc     = totalChars > 0 ? Math.round((correct / totalChars) * 100) : 0;

    setWpm(calcWpm);
    setAccuracy(calcAcc);
    setPhase("done");

    if (applicantId) {
      setSaving(true);
      fetch(`/api/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typing_wpm: calcWpm, typing_accuracy: calcAcc }),
      })
        .catch(() => {})
        .finally(() => setSaving(false));
    }
  }, [applicantId]);

  function startTest() {
    setPhase("test");
    setTyped("");
    setTimeLeft(DURATION);
    startRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTyped((current) => { finishTest(current); return current; });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (phase !== "test") return;
    const val = e.target.value;
    if (val.length > PASSAGE.length) return;
    setTyped(val);
    if (val.length === PASSAGE.length) {
      finishTest(val);
    }
  }

  function proceed() {
    router.push(`/${params.role}/quiz${applicantId ? `?aid=${applicantId}` : ""}`);
  }

  // Render passage with character-level highlighting
  function renderPassage() {
    return PASSAGE.split("").map((char, i) => {
      let cls = "text-[#555]";
      if (i < typed.length) {
        cls = typed[i] === char ? "text-white" : "text-red-400 bg-red-900/30";
      } else if (i === typed.length) {
        cls = "text-[#555] border-b-2 border-[#f97316]";
      }
      return (
        <span key={i} className={cls}>
          {char}
        </span>
      );
    });
  }

  const timerPct = (timeLeft / DURATION) * 100;

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-3">Typing Test</p>
        <h1 className="text-3xl font-bold text-white mb-4">How fast do you type?</h1>
        <p className="text-[#a1a1aa] mb-2">You have <span className="text-white font-semibold">60 seconds</span> to type a passage as accurately and quickly as possible.</p>
        <p className="text-[#a1a1aa] text-sm mb-8">Your WPM and accuracy will be saved to your profile. Type the passage below — do not copy and paste.</p>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-8 text-left text-[#777] text-sm leading-relaxed font-mono">
          {PASSAGE}
        </div>
        <button
          onClick={startTest}
          className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
        >
          Start Typing Test
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const wpmLabel = wpm >= 60 ? "Excellent" : wpm >= 40 ? "Good" : wpm >= 25 ? "Average" : "Needs improvement";
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-3">Typing Test Complete</p>
        <h1 className="text-3xl font-bold text-white mb-8">Your results</h1>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
            <p className="text-5xl font-black text-[#f97316] mb-2">{wpm}</p>
            <p className="text-[#a1a1aa] text-sm">Words Per Minute</p>
            <p className="text-[#555] text-xs mt-1">{wpmLabel}</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
            <p className="text-5xl font-black text-[#f97316] mb-2">{accuracy}%</p>
            <p className="text-[#a1a1aa] text-sm">Accuracy</p>
          </div>
        </div>
        {saving && <p className="text-[#555] text-sm mb-4">Saving results...</p>}
        <button
          onClick={proceed}
          disabled={saving}
          className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
        >
          Continue to Quiz →
        </button>
      </div>
    );
  }

  // Test phase
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 select-none" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#a1a1aa] text-sm">Type the passage below</span>
        <span className={`text-xl font-black tabular-nums ${timeLeft <= 10 ? "text-red-400" : "text-[#f97316]"}`}>{timeLeft}s</span>
      </div>

      <div className="h-1 w-full bg-[#2a2a2a] rounded-full mb-6 overflow-hidden">
        <div
          className={`h-1 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-red-500" : "bg-[#f97316]"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-4 font-mono text-sm leading-relaxed">
        {renderPassage()}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleInput}
        className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#f97316]"
        placeholder="Start typing here..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <div className="flex justify-between mt-3 text-xs text-[#555]">
        <span>{typed.length} / {PASSAGE.length} characters</span>
        <span>{Math.round((typed.length / PASSAGE.length) * 100)}% complete</span>
      </div>
    </div>
  );
}

export default function TypingTestPage() {
  return <Suspense><TypingTestInner /></Suspense>;
}
