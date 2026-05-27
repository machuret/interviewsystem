"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsQuestion } from "../_types";
import { ROLES } from "@/lib/roles";
import Spinner from "./Spinner";
import { SkeletonCard } from "@/components/Skeleton";

type DailyPoint = { date: string; count: number };
type ScoreBin   = { score: number; count: number };
type Metrics = {
  total_applications: number;
  passed: number;
  total_completed: number;
  pass_rate: number;
  avg_score: number | null;
};

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="text-brand-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

function OverviewPanel() {
  const [loading, setLoading]   = useState(true);
  const [daily, setDaily]       = useState<DailyPoint[]>([]);
  const [scores, setScores]     = useState<ScoreBin[]>([]);
  const [metrics, setMetrics]   = useState<Metrics | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/analytics?view=overview")
      .then((r) => r.json())
      .then((d) => {
        setDaily(d.daily_applications ?? []);
        setScores(d.score_distribution ?? []);
        setMetrics(d.metrics ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={6} />
    </div>
  );
  if (!metrics) return <p className="text-brand-text-muted text-sm">No data yet.</p>;

  const maxDaily = Math.max(...daily.map((d) => d.count), 1);
  const maxScore = Math.max(...scores.map((s) => s.count), 1);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-8">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Applications (14d)" value={metrics.total_applications} />
        <MetricCard label="Quizzes completed" value={metrics.total_completed} />
        <MetricCard label="Pass rate" value={`${metrics.pass_rate}%`} sub={`${metrics.passed} passed`} />
        <MetricCard label="Avg quiz score" value={metrics.avg_score != null ? `${metrics.avg_score}/10` : "—"} />
      </div>

      {/* Daily applications chart */}
      <div className="card p-5">
        <p className="text-white font-semibold text-sm mb-4">Applications — last 14 days</p>
        <div className="flex items-end gap-1 h-24">
          {daily.map((d) => (
            <div key={d.date} className="flex-1 h-full flex flex-col justify-end group relative">
              <div
                className="bg-brand-orange/70 hover:bg-brand-orange rounded-t transition-all duration-300"
                style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 8 : 0)}%` }}
              />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-brand-black-soft border border-brand-black-border rounded px-2 py-0.5 text-white text-xs whitespace-nowrap z-10">
                {d.count} on {formatDate(d.date)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-brand-text-muted text-xs">
          <span>{daily[0] ? formatDate(daily[0].date) : ""}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Score distribution */}
      <div className="card p-5">
        <p className="text-white font-semibold text-sm mb-4">Score distribution (quiz)</p>
        <div className="space-y-1.5">
          {scores.map((s) => (
            <div key={s.score} className="flex items-center gap-3">
              <span className="text-brand-text-muted text-xs tabular-nums w-4 text-right">{s.score}</span>
              <div className="flex-1 h-5 bg-brand-black-border rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 ${
                    s.score >= 7 ? "bg-green-500/70" : s.score >= 5 ? "bg-yellow-500/70" : "bg-red-500/70"
                  }`}
                  style={{ width: `${(s.count / maxScore) * 100}%` }}
                />
              </div>
              <span className="text-brand-text-muted text-xs tabular-nums w-6">{s.count}</span>
            </div>
          ))}
        </div>
        <p className="text-brand-text-muted text-xs mt-3">Pass threshold: 7/10 (green)</p>
      </div>
    </div>
  );
}

function QuestionsPanel() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [questions, setQuestions]           = useState<AnalyticsQuestion[]>([]);
  const [loading, setLoading]               = useState(false);
  const [empty, setEmpty]                   = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setEmpty(false);
    const params = new URLSearchParams();
    if (selectedRoleId) params.set("role_id", selectedRoleId);
    const res = await fetch(`/api/admin/analytics?${params}`);
    if (res.ok) {
      const d = await res.json();
      const qs: AnalyticsQuestion[] = d.questions ?? [];
      setQuestions(qs);
      setEmpty(qs.length === 0);
    }
    setLoading(false);
  }, [selectedRoleId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button onClick={() => setSelectedRoleId(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${!selectedRoleId ? "bg-brand-orange border-brand-orange text-white" : "bg-brand-black-soft border-brand-black-border text-brand-text-tertiary hover:text-white"}`}>
          All Roles
        </button>
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setSelectedRoleId(r.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${selectedRoleId === r.id ? "bg-brand-orange border-brand-orange text-white" : "bg-brand-black-soft border-brand-black-border text-brand-text-tertiary hover:text-white"}`}>
            {r.name}
          </button>
        ))}
      </div>
      <p className="text-brand-text-muted text-xs mb-4">Sorted by highest error rate. Only shows questions with at least 1 attempt.</p>
      {loading ? <Spinner /> : empty ? (
        <div className="text-center py-16 text-brand-text-muted">
          <p>No analytics data yet.</p>
          <p className="text-xs mt-1">Appears after candidates complete the quiz (requires migration 007).</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="card p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand-orange font-bold text-sm w-6 shrink-0 tabular-nums">#{i + 1}</span>
                    <p className="text-white text-sm font-medium">{q.question_text}</p>
                  </div>
                  {q.role && <p className="text-brand-text-muted text-xs ml-8">{q.role.name}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-2xl font-bold tabular-nums ${q.error_rate >= 70 ? "text-red-400" : q.error_rate >= 40 ? "text-yellow-400" : "text-green-400"}`}>
                    {q.error_rate}%
                  </p>
                  <p className="text-brand-text-muted text-xs">error rate</p>
                  <p className="text-brand-text-muted text-xs tabular-nums">{q.correct}/{q.total} correct</p>
                </div>
              </div>
              <div className="mt-2 ml-8 h-1 bg-brand-black-border rounded-full overflow-hidden">
                <div className={`h-1 rounded-full ${q.error_rate >= 70 ? "bg-red-500" : q.error_rate >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${q.error_rate}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsTab() {
  const [activeTab, setActiveTab] = useState<"overview" | "questions">("overview");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-brand-black-border">
        {(["overview", "questions"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors duration-150 ${
              activeTab === tab ? "border-brand-orange text-white" : "border-transparent text-brand-text-tertiary hover:text-white"
            }`}>
            {tab === "overview" ? "Overview" : "Question Analysis"}
          </button>
        ))}
      </div>
      {activeTab === "overview" ? <OverviewPanel /> : <QuestionsPanel />}
    </div>
  );
}
