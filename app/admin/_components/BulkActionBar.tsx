"use client";

type Props = {
  count: number;
  onShortlist: () => void;
  onInterview: () => void;
  onReject: () => void;
  onExportCvs: () => void;
  onClear: () => void;
};

export default function BulkActionBar({ count, onShortlist, onInterview, onReject, onExportCvs, onClear }: Props) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 card-inner px-5 py-3 shadow-2xl shadow-black/60 border-brand-orange/30">
      <span className="text-brand-text-secondary text-sm font-medium tabular-nums">
        {count} selected
      </span>
      <div className="w-px h-4 bg-brand-black-border" />
      <button onClick={onShortlist} className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-150">Shortlist</button>
      <button onClick={onInterview} className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-150">Interview</button>
      <button onClick={onReject}    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-150">Reject</button>
      <div className="w-px h-4 bg-brand-black-border" />
      <button onClick={onExportCvs} className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-150">📄 CVs</button>
      <div className="w-px h-4 bg-brand-black-border" />
      <button onClick={onClear} className="text-brand-text-muted hover:text-white text-sm transition-colors duration-150">✕ Clear</button>
    </div>
  );
}
