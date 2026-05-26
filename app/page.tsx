import Link from "next/link";
import { ROLES } from "@/lib/roles";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="section-label mb-3">RapidTal Talent Application</p>
        <h1 className="text-fluid-display font-bold text-white mb-4">
          Think you've got what it takes?
        </h1>
        <p className="text-brand-text-secondary text-fluid-lead max-w-xl mx-auto leading-relaxed">
          Select the role you're applying for. You'll share your details, then
          answer 10 skill-based questions with a 45-second timer. Score 7 or
          above and you'll be invited to submit your CV.
        </p>
      </div>

      <div className="card-inner p-4 mb-8 text-sm text-brand-text-secondary">
        <p className="font-semibold text-white mb-1">Before you start:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>10 questions · 45 seconds each · no going back</li>
          <li>Switching tabs or windows will automatically end your attempt</li>
          <li>Have your CV (PDF) or Google Doc link ready</li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map((role) => (
          <Link
            key={role.slug}
            href={`/${role.slug}/apply`}
            className="group block card p-6 hover:border-brand-orange hover:bg-brand-black-card transition-all duration-150"
          >
            <div className="text-3xl mb-3">{role.icon}</div>
            <h2 className="text-white font-semibold text-lg mb-1 group-hover:text-brand-orange transition-colors duration-150">
              {role.name}
            </h2>
            <p className="text-brand-text-tertiary text-sm">{role.description}</p>
            <div className="mt-4 text-brand-orange text-sm font-medium flex items-center gap-1">
              Apply now <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-brand-text-muted text-sm mt-10">
        Placing Filipino talent with Australian businesses.{" "}
        <a href="https://rapidtal.com" target="_blank" rel="noopener noreferrer">
          rapidtal.com
        </a>
      </p>
    </div>
  );
}
