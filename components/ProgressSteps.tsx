type Props = {
  steps: string[];
  current: number; // 0-indexed
};

export default function ProgressSteps({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const last    = i === steps.length - 1;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-200 ${
                  done   ? "bg-brand-orange border-brand-orange text-white"
                  : active ? "bg-transparent border-brand-orange text-brand-orange"
                  : "bg-transparent border-[#2e2e2e] text-[#3f3f50]"
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? "text-white font-medium" : done ? "text-brand-orange" : "text-[#3f3f50]"}`}>
                {label}
              </span>
            </div>
            {!last && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-colors duration-300 ${done ? "bg-brand-orange" : "bg-[#2e2e2e]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
