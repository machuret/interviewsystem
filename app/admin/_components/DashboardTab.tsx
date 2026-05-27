"use client";

import { useState, useEffect } from "react";
import type { DashboardStats } from "../_types";
import { STATUSES, STATUS_HEADER_COLORS } from "../_types";
import { SkeletonCard } from "@/components/Skeleton";

export default function DashboardTab() {
  const [data, setData]       = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {[0,1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}
    </div>
  );
  if (error || !data) return <p className="text-red-400">{error || "Failed to load."}</p>;

  const { funnel, roles, status_counts } = data;
  const funnelSteps = [
    { label: "Started Application",   value: funnel.started_form },
    { label: "Took Quiz",             value: funnel.took_quiz },
    { label: "Passed Quiz",           value: funnel.passed_quiz },
    { label: "Submitted Application", value: funnel.applied },
  ];
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-white font-semibold text-lg mb-4">Funnel</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {funnelSteps.map((s, i) => (
            <div key={i} className="card p-5">
              <p className="text-2xl font-bold tabular-nums text-brand-orange mb-1">{s.value}</p>
              <p className="text-brand-text-secondary text-sm mb-3">{s.label}</p>
              <div className="h-1.5 bg-brand-black-border rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-brand-orange rounded-full"
                  style={{ width: `${(s.value / maxFunnel) * 100}%` }}
                />
              </div>
              {i > 0 && funnelSteps[i - 1].value > 0 && (
                <p className="text-brand-text-muted text-xs mt-1 tabular-nums">
                  {Math.round((s.value / funnelSteps[i - 1].value) * 100)}% of prev
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-white font-semibold text-lg mb-4">Candidates by Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATUSES.map((s) => (
            <div key={s} className={`bg-brand-black-soft border rounded-xl p-4 ${STATUS_HEADER_COLORS[s]}`}>
              <p className="text-xl font-bold tabular-nums mb-1">{status_counts[s] ?? 0}</p>
              <p className="text-sm capitalize">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {roles && roles.length > 0 && (
        <section>
          <h2 className="text-white font-semibold text-lg mb-4">By Role</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-black-border text-brand-text-muted text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-right px-4 py-3 font-medium">Form</th>
                  <th className="text-right px-4 py-3 font-medium">Quiz</th>
                  <th className="text-right px-4 py-3 font-medium">Passed</th>
                  <th className="text-right px-4 py-3 font-medium">Applied</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.slug} className="border-b border-brand-black-row last:border-0 hover:bg-brand-black-card">
                    <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-right text-brand-text-secondary tabular-nums">{r.started_form}</td>
                    <td className="px-4 py-3 text-right text-brand-text-secondary tabular-nums">{r.took_quiz}</td>
                    <td className="px-4 py-3 text-right text-brand-text-secondary tabular-nums">{r.passed}</td>
                    <td className="px-4 py-3 text-right text-brand-text-secondary tabular-nums">{r.applied}</td>
                    <td className="px-4 py-3 text-right text-brand-orange font-bold tabular-nums">{r.avg_score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
