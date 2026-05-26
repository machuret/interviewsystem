export default function Detail({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: boolean;
}) {
  return (
    <div>
      <span className="text-[#555] text-xs uppercase tracking-wide">{label}:</span>{" "}
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#f97316] text-sm underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-[#e5e5e5] text-sm">{value}</span>
      )}
    </div>
  );
}
