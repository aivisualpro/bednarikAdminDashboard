"use client";

import type { EmailScorecard } from "@/lib/types";

interface UserSummaryTableProps {
  data: EmailScorecard[];
  title: string;
}

function formatTime(seconds: number): string {
  if (!seconds) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

interface UserRow {
  user: string;
  totalCalls: number;
  outgoingCalls: number;
  answeredCalls: number;
  timeOnCalls: number;
  sentMessages: number;
}

function aggregateByUser(data: EmailScorecard[]): UserRow[] {
  const map = new Map<string, UserRow>();

  for (const row of data) {
    const name = row.user || "Unknown";
    if (!map.has(name)) {
      map.set(name, {
        user: name,
        totalCalls: 0,
        outgoingCalls: 0,
        answeredCalls: 0,
        timeOnCalls: 0,
        sentMessages: 0,
      });
    }
    const u = map.get(name)!;
    u.totalCalls += row.callsTotal;
    u.outgoingCalls += row.callsOutbound;
    u.answeredCalls += row.callsAnsweredTotal;
    u.timeOnCalls += row.totalTimeOnCalls;
    u.sentMessages += row.textSentTotal;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.user.localeCompare(b.user)
  );
}

export default function UserSummaryTable({
  data,
  title,
}: UserSummaryTableProps) {
  const rows = aggregateByUser(data);

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  // Calculate totals
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Total Calls
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Outgoing Calls
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Answered Calls
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time on Calls
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sent Messages
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.user}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                  {row.user}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                  {row.totalCalls.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                  {row.outgoingCalls.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                  {row.answeredCalls.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {formatTime(row.timeOnCalls)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                  {row.sentMessages.toLocaleString()}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
              <td className="px-4 py-3 text-gray-900">
                Total
              </td>
              <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                {totals.totalCalls.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                {totals.outgoingCalls.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                {totals.answeredCalls.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-900 tabular-nums whitespace-nowrap">
                {formatTime(totals.timeOnCalls)}
              </td>
              <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                {totals.sentMessages.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
