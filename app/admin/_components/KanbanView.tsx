"use client";

import { useRef } from "react";
import type { Candidate } from "../_types";
import { STATUSES, STATUS_HEADER_COLORS } from "../_types";

type Props = {
  candidates: Candidate[];
  updateStatus: (id: string, status: string) => void;
};

export default function KanbanView({ candidates, updateStatus }: Props) {
  const dragItem = useRef<{ id: string; status: string } | null>(null);

  function onDragStart(id: string, status: string) {
    dragItem.current = { id, status };
  }

  // Direct DOM manipulation — zero React re-renders during drag (no setState)
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.style.borderColor     = "#f97316";
    e.currentTarget.style.backgroundColor = "#1c1c1c";
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.style.borderColor     = "";
    e.currentTarget.style.backgroundColor = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, targetStatus: string) {
    e.currentTarget.style.borderColor     = "";
    e.currentTarget.style.backgroundColor = "";
    if (!dragItem.current || dragItem.current.status === targetStatus) return;
    updateStatus(dragItem.current.id, targetStatus);
    dragItem.current = null;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[60vh]">
      {STATUSES.map((status) => {
        const cols = candidates.filter((c) => c.status === status);
        const textColorClass = STATUS_HEADER_COLORS[status]
          .split(" ")
          .find((cls) => cls.startsWith("text-")) ?? "text-white";

        return (
          <div
            key={status}
            className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3 transition-colors"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold uppercase tracking-widest capitalize ${textColorClass}`}>
                {status}
              </p>
              <span className="text-[#555] text-xs bg-[#1c1c1c] px-2 py-0.5 rounded-full">
                {cols.length}
              </span>
            </div>

            <div className="space-y-2">
              {cols.map((c) => {
                const isSuspicious =
                  (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 ||
                  (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id, c.status)}
                    className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-[#3a3a3a] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-white text-xs font-medium truncate flex-1">{c.full_name}</p>
                      {isSuspicious && (
                        <span className="text-yellow-400 text-xs shrink-0" title="Suspicious activity">⚠</span>
                      )}
                    </div>
                    <p className="text-[#555] text-xs truncate">
                      {c.apply_quiz_sessions?.apply_roles?.name ?? "—"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[#f97316] text-xs font-bold">
                        {c.apply_quiz_sessions?.score ?? "—"}/10
                      </span>
                      <span className="text-[#555] text-xs">
                        {new Date(c.submitted_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {cols.length === 0 && (
                <p className="text-[#555] text-xs text-center py-6">Drop here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
