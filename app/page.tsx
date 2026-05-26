import Link from "next/link";
import { ROLES } from "@/lib/roles";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-3">
          RapidTal Talent Application
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Think you've got what it takes?
        </h1>
        <p className="text-[#a1a1aa] text-lg max-w-xl mx-auto">
          Select the role you're applying for. You'll share your details, then
          answer 10 skill-based questions with a 45-second timer. Score 7 or
          above and you'll be invited to submit your CV.
        </p>
      </div>

      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 mb-8 text-sm text-[#a1a1aa]">
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
            className="group block bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#f97316] hover:bg-[#1c1c1c] transition-all duration-200"
          >
            <div className="text-3xl mb-3">{role.icon}</div>
            <h2 className="text-white font-semibold text-lg mb-1 group-hover:text-[#f97316] transition-colors">
              {role.name}
            </h2>
            <p className="text-[#777] text-sm">{role.description}</p>
            <div className="mt-4 text-[#f97316] text-sm font-medium flex items-center gap-1">
              Apply now <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-[#555] text-sm mt-10">
        Placing Filipino talent with Australian businesses.{" "}
        <a href="https://rapidtal.com" target="_blank" rel="noopener noreferrer">
          rapidtal.com
        </a>
      </p>
    </div>
  );
}
