import Link from "next/link";

export default function ScreenedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="mb-6 text-[#666680]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <p className="section-label mb-3">Thank you for your interest</p>
      <h1 className="text-fluid-heading font-bold text-white mb-4">
        We appreciate your time
      </h1>
      <p className="text-brand-text-secondary leading-relaxed mb-3">
        After reviewing your profile, we don't have a position that's the right
        fit for you at this stage.
      </p>
      <p className="text-brand-text-muted text-sm mb-10">
        We do receive new roles regularly — feel free to check back in a few
        months if your circumstances change.
      </p>
      <Link href="/" className="btn-ghost px-8 py-3 text-sm">
        ← Back to roles
      </Link>
    </div>
  );
}
