import Link from "next/link";

export default function FailPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-6">💪</div>
      <h1 className="text-3xl font-bold text-white mb-4">
        Thanks for giving it a go
      </h1>
      <p className="text-[#a1a1aa] text-lg mb-6 leading-relaxed">
        We appreciate you taking the time to apply. We'll keep your profile on
        file and may reach out if a suitable opportunity arises in the future.
      </p>
      <p className="text-[#a1a1aa] mb-8">
        In the meantime, feel free to sharpen your skills and try again in 30 days.
      </p>

      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-8 text-left">
        <p className="text-white font-semibold mb-2 text-sm">Free resources to help you prepare:</p>
        <ul className="text-[#a1a1aa] text-sm space-y-1 list-disc list-inside">
          <li>Google Digital Garage — free marketing certification</li>
          <li>HubSpot Academy — free sales & CRM courses</li>
          <li>Coursera — virtual assistant fundamentals</li>
        </ul>
      </div>

      <Link
        href="/"
        className="inline-block bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white font-medium px-8 py-3 rounded-xl transition-colors"
      >
        ← Back to role selection
      </Link>

      <p className="text-[#555] text-sm mt-8">
        Questions? Email{" "}
        <a href="mailto:hello@rapidtal.com" className="text-[#f97316]">
          hello@rapidtal.com
        </a>
      </p>
    </div>
  );
}
