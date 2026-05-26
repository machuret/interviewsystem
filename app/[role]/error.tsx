"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RoleError({
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
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="btn-primary text-sm font-medium px-6 py-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="card-inner hover:border-brand-orange text-brand-text-secondary text-sm font-medium px-6 py-2 rounded-lg transition-colors duration-150"
        >
          Back to roles
        </Link>
      </div>
    </div>
  );
}
