import Link from "next/link";

export default function ScreenedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">🙏</div>
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
