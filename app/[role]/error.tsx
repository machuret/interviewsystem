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
      <p className="text-[#555] text-sm mb-6">{error.message}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#f97316] text-[#a1a1aa] text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Back to roles
        </Link>
      </div>
    </div>
  );
}
