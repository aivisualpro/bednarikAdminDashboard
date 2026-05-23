"use client";

import type { EmailScorecard } from "@/lib/types";

interface CompanyActivityProps {
  data: EmailScorecard[];
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

interface MetricRow {
  label: string;
  total: number;
  perDay: number;
  perHour: number;
  isTime?: boolean;
  accent?: string;
}

function fmt(val: number, isTime?: boolean): string {
  if (isTime) return formatTime(val);
  return Math.round(val).toLocaleString();
}

export default function CompanyActivity({ data }: CompanyActivityProps) {
  // Aggregate all Company rows
  const agg = data.reduce(
    (a, r) => ({
      callsTotal: a.callsTotal + r.callsTotal,
      callsMissed: a.callsMissed + r.callsMissed,
      callsMissedUnanswered: a.callsMissedUnanswered + r.callsMissedUnanswered,
      callsMissedAbandoned: a.callsMissedAbandoned + r.callsMissedAbandoned,
      callsAnsweredTotal: a.callsAnsweredTotal + r.callsAnsweredTotal,
      callsAnsweredTeamMember: a.callsAnsweredTeamMember + r.callsAnsweredTeamMember,
      callsAnsweredSona: a.callsAnsweredSona + r.callsAnsweredSona,
      callsOutbound: a.callsOutbound + r.callsOutbound,
      totalTimeOnCalls: a.totalTimeOnCalls + r.totalTimeOnCalls,
      textSentTotal: a.textSentTotal + r.textSentTotal,
      textReceivedTotal: a.textReceivedTotal + r.textReceivedTotal,
    }),
    {
      callsTotal: 0, callsMissed: 0, callsMissedUnanswered: 0, callsMissedAbandoned: 0,
      callsAnsweredTotal: 0, callsAnsweredTeamMember: 0, callsAnsweredSona: 0,
      callsOutbound: 0, totalTimeOnCalls: 0, textSentTotal: 0, textReceivedTotal: 0,
    }
  );

  const missedPct = pct(agg.callsMissed, agg.callsTotal);
  const answeredPct = pct(agg.callsAnsweredTotal, agg.callsTotal);

  const metrics: MetricRow[] = [
    { label: "Total Calls", total: agg.callsTotal, perDay: agg.callsTotal / 5, perHour: agg.callsTotal / 40 },
    { label: "Calls Missed", total: agg.callsMissed, perDay: agg.callsMissed / 5, perHour: agg.callsMissed / 40, accent: "text-red-600" },
    { label: "Missed (Unanswered)", total: agg.callsMissedUnanswered, perDay: agg.callsMissedUnanswered / 5, perHour: agg.callsMissedUnanswered / 40 },
    { label: "Missed (Abandoned)", total: agg.callsMissedAbandoned, perDay: agg.callsMissedAbandoned / 5, perHour: agg.callsMissedAbandoned / 40 },
    { label: "Calls Answered", total: agg.callsAnsweredTotal, perDay: agg.callsAnsweredTotal / 5, perHour: agg.callsAnsweredTotal / 40, accent: "text-green-600" },
    { label: "Answered (Team Member)", total: agg.callsAnsweredTeamMember, perDay: agg.callsAnsweredTeamMember / 5, perHour: agg.callsAnsweredTeamMember / 40 },
    { label: "Answered (Sona)", total: agg.callsAnsweredSona, perDay: agg.callsAnsweredSona / 5, perHour: agg.callsAnsweredSona / 40 },
    { label: "Outbound Calls", total: agg.callsOutbound, perDay: agg.callsOutbound / 5, perHour: agg.callsOutbound / 40 },
    { label: "Time on Calls", total: agg.totalTimeOnCalls, perDay: agg.totalTimeOnCalls / 5, perHour: agg.totalTimeOnCalls / 40, isTime: true },
    { label: "Texts Sent", total: agg.textSentTotal, perDay: agg.textSentTotal / 5, perHour: agg.textSentTotal / 40 },
    { label: "Texts Received", total: agg.textReceivedTotal, perDay: agg.textReceivedTotal / 5, perHour: agg.textReceivedTotal / 40 },
  ];

  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Activity</h3>
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Company Activity</h3>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Answered {answeredPct}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Missed {missedPct}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Metric
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Per Day
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Per Hour
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.label} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className={`px-4 py-2.5 font-medium ${m.accent || "text-gray-800"}`}>
                  {m.label}
                </td>
                <td className="px-4 py-2.5 text-center text-gray-700 tabular-nums">
                  {fmt(m.total, m.isTime)}
                </td>
                <td className="px-4 py-2.5 text-center text-gray-500 tabular-nums">
                  {fmt(m.perDay, m.isTime)}
                </td>
                <td className="px-4 py-2.5 text-center text-gray-500 tabular-nums">
                  {fmt(m.perHour, m.isTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
