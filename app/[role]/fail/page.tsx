import Link from "next/link";

export default function FailPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-6">💪</div>
      <h1 className="text-fluid-heading font-bold text-white mb-4">
        Thanks for giving it a go
      </h1>
      <p className="text-brand-text-secondary text-fluid-lead mb-6 leading-relaxed">
        We appreciate you taking the time to apply. We'll keep your profile on
        file and may reach out if a suitable opportunity arises in the future.
      </p>
      <p className="text-brand-text-secondary mb-8">
        In the meantime, feel free to sharpen your skills and try again in 30 days.
      </p>

      <div className="card p-5 mb-8 text-left">
        <p className="text-white font-semibold mb-2 text-sm">Free resources to help you prepare:</p>
        <ul className="text-brand-text-secondary text-sm space-y-1 list-disc list-inside">
          <li>Google Digital Garage — free marketing certification</li>
          <li>HubSpot Academy — free sales &amp; CRM courses</li>
          <li>Coursera — virtual assistant fundamentals</li>
        </ul>
      </div>

      <Link
        href="/"
        className="btn-ghost inline-block px-8 py-3"
      >
        ← Back to role selection
      </Link>

      <p className="text-brand-text-muted text-sm mt-8">
        Questions? Email{" "}
        <a href="mailto:hello@rapidtal.com" className="text-brand-orange">
          hello@rapidtal.com
        </a>
      </p>
    </div>
  );
}
