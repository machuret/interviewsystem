"use client";

import { useState } from "react";
import { REJECTION_REASONS } from "../_types";

type Props = {
  count: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export default function RejectionModal({ count, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="card w-full max-w-sm p-6 shadow-2xl shadow-black/80">
        <h2 className="text-white font-semibold mb-1">
          Reject {count === 1 ? "candidate" : `${count} candidates`}
        </h2>
        <p className="text-brand-text-muted text-sm mb-5">Select a rejection reason to save with the record.</p>

        <div className="space-y-2 mb-6">
          {REJECTION_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                reason === r
                  ? "bg-red-900/30 border border-red-700/50"
                  : "card-inner hover:border-brand-black-border"
              }`}
            >
              <input
                type="radio"
                name="rejection_reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-red-500"
              />
              <span className={`text-sm ${reason === r ? "text-red-300" : "text-brand-text-secondary"}`}>{r}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-150"
          >
            Confirm rejection
          </button>
          <button
            onClick={onCancel}
            className="btn-ghost px-5 py-2.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
