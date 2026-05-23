"use client";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export default function KpiCard({ label, value, subtitle, trend }: KpiCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-500"
        : "text-gray-400";

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
        {label}
      </span>
      <span className="text-2xl font-semibold text-gray-900 tabular-nums">
        {value}
      </span>
      {subtitle && (
        <span className={`text-xs font-medium ${trendColor}`}>{subtitle}</span>
      )}
    </div>
  );
}
