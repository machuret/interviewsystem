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
      <span className="text-brand-text-muted text-xs uppercase tracking-wide">{label}:</span>{" "}
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-orange text-sm underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-brand-text-body text-sm">{value}</span>
      )}
    </div>
  );
}
