"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-red-400 text-lg font-semibold mb-2">Something went wrong</p>
      <p className="text-brand-text-muted text-sm mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="btn-primary text-sm font-medium px-6 py-2"
      >
        Try again
      </button>
    </div>
  );
}
