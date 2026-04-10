import {
  getLabStatusLabel,
  getLabStatusTone,
} from "@/lib/medical-constants";

export function LabResultBadge({ status }: { status: string }) {
  const tone = getLabStatusTone(status);
  const label = getLabStatusLabel(status);

  const className =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${className}`}
    >
      {label}
    </span>
  );
}
