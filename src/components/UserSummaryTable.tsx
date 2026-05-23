"use client";

import type { EmailScorecard } from "@/lib/types";
import Image from "next/image";

interface UserSummaryTableProps {
  data: EmailScorecard[];
  prevData?: EmailScorecard[];
  title: string;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

interface UserRow {
  user: string;
  image: string;
  totalCalls: number;
  outgoingCalls: number;
  answeredCalls: number;
  timeOnCalls: number;
  sentMessages: number;
}

function aggregateByUser(data: EmailScorecard[]): Map<string, UserRow> {
  const map = new Map<string, UserRow>();
  for (const row of data) {
    const name = row.user || "Unknown";
    if (!map.has(name)) {
      map.set(name, {
        user: name, image: row.image || "",
        totalCalls: 0, outgoingCalls: 0, answeredCalls: 0, timeOnCalls: 0, sentMessages: 0,
      });
    }
    const u = map.get(name)!;
    u.totalCalls += row.callsTotal;
    u.outgoingCalls += row.callsOutbound;
    u.answeredCalls += row.callsAnsweredTotal;
    u.timeOnCalls += row.totalTimeOnCalls;
    u.sentMessages += row.textSentTotal;
    if (!u.image && row.image) u.image = row.image;
  }
  return map;
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-gray-300 text-xs">—</span>;
  if (previous === 0) return <span className="text-green-600 text-xs font-medium whitespace-nowrap">↑ new</span>;
  const pctChange = Math.round(((current - previous) / previous) * 100);
  if (pctChange === 0) return <span className="text-gray-400 text-xs">—</span>;
  const isUp = pctChange > 0;
  return (
    <span className={`text-xs font-medium whitespace-nowrap ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? "↑" : "↓"} {Math.abs(pctChange)}%
    </span>
  );
}

function UserAvatar({ src, name }: { src: string; name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (src) {
    return (
      <Image src={src} alt={name} width={28} height={28}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0" unoptimized />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-medium text-gray-500">{initials}</span>
    </div>
  );
}

// Format a number value: for time use h/m, for others use locale string
function fmtVal(val: number, isTime: boolean): string {
  if (isTime) return formatTime(val);
  return Math.round(val).toLocaleString();
}

const GROUP_COLORS = [
  { header: "bg-gray-900 text-white", sub: "bg-gray-100 text-gray-600" },
  { header: "bg-emerald-700 text-white", sub: "bg-emerald-50 text-emerald-700" },
  { header: "bg-blue-700 text-white", sub: "bg-blue-50 text-blue-700" },
  { header: "bg-amber-600 text-white", sub: "bg-amber-50 text-amber-700" },
  { header: "bg-violet-700 text-white", sub: "bg-violet-50 text-violet-700" },
];

const METRIC_KEYS: { key: keyof UserRow; label: string; isTime: boolean }[] = [
  { key: "totalCalls", label: "Total Calls", isTime: false },
  { key: "outgoingCalls", label: "Outgoing Calls", isTime: false },
  { key: "answeredCalls", label: "Answered Calls", isTime: false },
  { key: "timeOnCalls", label: "Time on Calls", isTime: true },
  { key: "sentMessages", label: "Sent Messages", isTime: false },
];

export default function UserSummaryTable({ data, prevData, title }: UserSummaryTableProps) {
  const currentMap = aggregateByUser(data);
  const rows = Array.from(currentMap.values()).sort((a, b) => a.user.localeCompare(b.user));
  const prevMap = prevData ? aggregateByUser(prevData) : null;

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">No data available</div>
      </div>
    );
  }

  const totals = rows.reduce(
    (acc, r) => ({
      totalCalls: acc.totalCalls + r.totalCalls,
      outgoingCalls: acc.outgoingCalls + r.outgoingCalls,
      answeredCalls: acc.answeredCalls + r.answeredCalls,
      timeOnCalls: acc.timeOnCalls + r.timeOnCalls,
      sentMessages: acc.sentMessages + r.sentMessages,
    }),
    { totalCalls: 0, outgoingCalls: 0, answeredCalls: 0, timeOnCalls: 0, sentMessages: 0 }
  );

  const prevTotals = prevMap
    ? Array.from(prevMap.values()).reduce(
        (acc, r) => ({
          totalCalls: acc.totalCalls + r.totalCalls,
          outgoingCalls: acc.outgoingCalls + r.outgoingCalls,
          answeredCalls: acc.answeredCalls + r.answeredCalls,
          timeOnCalls: acc.timeOnCalls + r.timeOnCalls,
          sentMessages: acc.sentMessages + r.sentMessages,
        }),
        { totalCalls: 0, outgoingCalls: 0, answeredCalls: 0, timeOnCalls: 0, sentMessages: 0 }
      )
    : null;

  function renderMetricCells(val: number, prevVal: number | undefined, isTime: boolean, showTrend: boolean) {
    const day = val / 5;
    const hour = val / 40;
    return (
      <>
        <td className="px-2 py-2.5 text-center text-xs text-gray-800 tabular-nums whitespace-nowrap">
          <div className="flex items-center justify-center gap-1.5">
            <span>{fmtVal(val, isTime)}</span>
            {showTrend && prevVal !== undefined && (
              <TrendBadge current={val} previous={prevVal} />
            )}
          </div>
        </td>
        <td className="px-2 py-2.5 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {fmtVal(day, isTime)}
        </td>
        <td className="px-2 py-2.5 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap border-r border-gray-100">
          {fmtVal(hour, isTime)}
        </td>
      </>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            {/* Group headers */}
            <tr>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-r border-gray-200 min-w-[180px]"
              >
                User
              </th>
              {METRIC_KEYS.map((m, i) => (
                <th
                  key={m.key}
                  colSpan={3}
                  className={`px-2 py-2 text-center text-xs font-semibold border-b border-r border-gray-200 ${GROUP_COLORS[i % GROUP_COLORS.length].header}`}
                >
                  {m.label}
                </th>
              ))}
            </tr>
            {/* Sub headers */}
            <tr>
              {METRIC_KEYS.map((m, i) => (
                <>
                  <th key={`${m.key}-t`} className={`px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider border-b border-gray-200 ${GROUP_COLORS[i % GROUP_COLORS.length].sub}`}>
                    Total
                  </th>
                  <th key={`${m.key}-d`} className={`px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider border-b border-gray-200 ${GROUP_COLORS[i % GROUP_COLORS.length].sub}`}>
                    Day
                  </th>
                  <th key={`${m.key}-h`} className={`px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider border-b border-r border-gray-200 ${GROUP_COLORS[i % GROUP_COLORS.length].sub}`}>
                    Hour
                  </th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const prev = prevMap?.get(row.user);
              const hasPrev = prev !== undefined;
              return (
                <tr key={row.user} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar src={row.image} name={row.user} />
                      <span className="text-gray-900 font-medium text-xs">{row.user}</span>
                    </div>
                  </td>
                  {METRIC_KEYS.map((m) =>
                    renderMetricCells(
                      row[m.key] as number,
                      hasPrev ? (prev[m.key] as number) : undefined,
                      m.isTime,
                      hasPrev
                    )
                  )}
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
              <td className="px-3 py-2.5 text-gray-900 border-r border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7" />
                  <span className="text-xs">Total</span>
                </div>
              </td>
              {METRIC_KEYS.map((m) =>
                renderMetricCells(
                  totals[m.key] as number,
                  prevTotals ? (prevTotals[m.key] as number) : undefined,
                  m.isTime,
                  !!prevTotals
                )
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
