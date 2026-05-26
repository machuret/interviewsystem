"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsQuestion } from "../_types";
import { ROLES } from "@/lib/roles";
import Spinner from "./Spinner";

export default function AnalyticsTab() {
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
        <button
          onClick={() => setSelectedRoleId(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            !selectedRoleId
              ? "bg-[#f97316] border-[#f97316] text-white"
              : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
          }`}
        >
          All Roles
        </button>
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRoleId(r.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedRoleId === r.id
                ? "bg-[#f97316] border-[#f97316] text-white"
                : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <p className="text-[#555] text-xs mb-4">
        Sorted by highest error rate. Only shows questions with at least 1 attempt.
      </p>

      {loading ? (
        <Spinner />
      ) : empty ? (
        <div className="text-center py-16 text-[#555]">
          <p>No analytics data yet.</p>
          <p className="text-xs mt-1">
            Appears after candidates complete the quiz (requires migration 007).
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#f97316] font-black text-sm w-6 shrink-0">#{i + 1}</span>
                    <p className="text-white text-sm font-medium">{q.question_text}</p>
                  </div>
                  {q.role && (
                    <p className="text-[#555] text-xs ml-8">{q.role.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-2xl font-black ${
                      q.error_rate >= 70
                        ? "text-red-400"
                        : q.error_rate >= 40
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {q.error_rate}%
                  </p>
                  <p className="text-[#555] text-xs">error rate</p>
                  <p className="text-[#555] text-xs">{q.correct}/{q.total} correct</p>
                </div>
              </div>
              <div className="mt-2 ml-8 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className={`h-1 rounded-full ${
                    q.error_rate >= 70
                      ? "bg-red-500"
                      : q.error_rate >= 40
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${q.error_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
