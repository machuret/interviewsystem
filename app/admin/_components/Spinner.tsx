export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className="animate-spin"
      >
        <circle cx="16" cy="16" r="12" stroke="#1e1e1e" strokeWidth="3" />
        <path
          d="M16 4 a12 12 0 0 1 12 12"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
