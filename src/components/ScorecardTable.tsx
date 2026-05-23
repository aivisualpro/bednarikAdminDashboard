"use client";

import type { CallScorecard } from "@/lib/types";

interface ScorecardTableProps {
  data: CallScorecard[];
  title: string;
}

// Group data by week (startDate) and pivot users into columns
function pivotByWeek(data: CallScorecard[]) {
  // Get unique users
  const usersSet = new Set<string>();
  data.forEach((r) => usersSet.add(r.user || "Unknown"));
  const users = Array.from(usersSet).sort();

  // Group by startDate (week)
  const weekMap = new Map<
    string,
    {
      startDate: string;
      endDate: string;
      totals: {
        ticketsReceived: number;
        ticketsClosed: number;
        avgTicketsDay: number;
        msgReceived: number;
        msgSent: number;
        count: number;
      };
      byUser: Record<
        string,
        {
          ticketsReceived: number;
          ticketsClosed: number;
          msgReceived: number;
          msgSent: number;
        }
      >;
    }
  >();

  for (const row of data) {
    const key = row.startDate;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        startDate: row.startDate,
        endDate: row.endDate,
        totals: {
          ticketsReceived: 0,
          ticketsClosed: 0,
          avgTicketsDay: 0,
          msgReceived: 0,
          msgSent: 0,
          count: 0,
        },
        byUser: {},
      });
    }
    const week = weekMap.get(key)!;
    week.totals.ticketsReceived += row.totalTicketsReceived;
    week.totals.ticketsClosed += row.totalTicketsClosed;
    week.totals.avgTicketsDay += row.averageTicketsDay;
    week.totals.msgReceived += row.messagesReceived;
    week.totals.msgSent += row.messagesSent;
    week.totals.count += 1;

    const userName = row.user || "Unknown";
    if (!week.byUser[userName]) {
      week.byUser[userName] = {
        ticketsReceived: 0,
        ticketsClosed: 0,
        msgReceived: 0,
        msgSent: 0,
      };
    }
    week.byUser[userName].ticketsReceived += row.totalTicketsReceived;
    week.byUser[userName].ticketsClosed += row.totalTicketsClosed;
    week.byUser[userName].msgReceived += row.messagesReceived;
    week.byUser[userName].msgSent += row.messagesSent;
  }

  // Sort by date descending
  const weeks = Array.from(weekMap.values()).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return { users, weeks };
}

function formatDate(d: string) {
  if (!d) return "—";
  // If already in MM/DD/YYYY format, return as-is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) return d;
  try {
    const date = new Date(d);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return d;
  }
}

// User column color palette — muted professional tones
const userColors = [
  { bg: "bg-blue-50", header: "bg-blue-100 text-blue-800" },
  { bg: "bg-amber-50", header: "bg-amber-100 text-amber-800" },
  { bg: "bg-emerald-50", header: "bg-emerald-100 text-emerald-800" },
  { bg: "bg-purple-50", header: "bg-purple-100 text-purple-800" },
  { bg: "bg-rose-50", header: "bg-rose-100 text-rose-800" },
  { bg: "bg-cyan-50", header: "bg-cyan-100 text-cyan-800" },
  { bg: "bg-orange-50", header: "bg-orange-100 text-orange-800" },
  { bg: "bg-indigo-50", header: "bg-indigo-100 text-indigo-800" },
];

export default function ScorecardTable({ data, title }: ScorecardTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  const { users, weeks } = pivotByWeek(data);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          {/* ── Top group headers ─────────────────────────────── */}
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Date columns — no group header */}
              <th
                colSpan={2}
                className="px-3 py-2 text-center font-semibold text-gray-500 bg-gray-50 border-b border-r border-gray-200"
              >
                Period
              </th>
              {/* Totals group */}
              <th
                colSpan={5}
                className="px-3 py-2 text-center font-semibold bg-gray-100 text-gray-700 border-b border-r border-gray-200"
              >
                Totals
              </th>
              {/* Per-user groups */}
              {users.map((user, i) => (
                <th
                  key={user}
                  colSpan={4}
                  className={`px-3 py-2 text-center font-semibold border-b border-r border-gray-200 ${
                    userColors[i % userColors.length].header
                  }`}
                >
                  {user}
                </th>
              ))}
            </tr>
            {/* ── Sub-headers ──────────────────────────────────── */}
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2 text-left font-medium text-gray-500 bg-gray-50 border-r border-gray-100 whitespace-nowrap">
                Start
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                End
              </th>
              {/* Totals sub-headers */}
              <th className="px-3 py-2 text-right font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Tix Recv
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Tix Closed
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Avg/Day
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Msg Recv
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                Msg Sent
              </th>
              {/* Per-user sub-headers */}
              {users.map((user, i) => (
                <UserSubHeaders
                  key={user}
                  colorIdx={i}
                  isLast={i === users.length - 1}
                />
              ))}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────────── */}
          <tbody>
            {weeks.map((week, wi) => (
              <tr
                key={week.startDate}
                className={`border-b border-gray-50 ${
                  wi % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                } hover:bg-gray-50/70 transition-colors`}
              >
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-100">
                  {formatDate(week.startDate)}
                </td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-200">
                  {formatDate(week.endDate)}
                </td>
                {/* Totals */}
                <td className="px-3 py-2 text-right text-gray-900 font-medium tabular-nums">
                  {week.totals.ticketsReceived}
                </td>
                <td className="px-3 py-2 text-right text-gray-900 font-medium tabular-nums">
                  {week.totals.ticketsClosed}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 tabular-nums">
                  {week.totals.count > 0
                    ? (week.totals.avgTicketsDay / week.totals.count).toFixed(1)
                    : "0"}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 tabular-nums">
                  {week.totals.msgReceived}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 tabular-nums border-r border-gray-200">
                  {week.totals.msgSent}
                </td>
                {/* Per-user values */}
                {users.map((user, i) => {
                  const u = week.byUser[user];
                  const bg = userColors[i % userColors.length].bg;
                  return (
                    <UserCells
                      key={user}
                      data={u}
                      bgClass={bg}
                      isLast={i === users.length - 1}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserSubHeaders({
  colorIdx,
  isLast,
}: {
  colorIdx: number;
  isLast: boolean;
}) {
  const c = userColors[colorIdx % userColors.length];
  const border = isLast ? "" : "border-r border-gray-200";
  return (
    <>
      <th
        className={`px-2 py-2 text-right font-medium ${c.header} whitespace-nowrap`}
      >
        Tix Recv
      </th>
      <th
        className={`px-2 py-2 text-right font-medium ${c.header} whitespace-nowrap`}
      >
        Closed
      </th>
      <th
        className={`px-2 py-2 text-right font-medium ${c.header} whitespace-nowrap`}
      >
        Msg In
      </th>
      <th
        className={`px-2 py-2 text-right font-medium ${c.header} whitespace-nowrap ${border}`}
      >
        Msg Out
      </th>
    </>
  );
}

function UserCells({
  data,
  bgClass,
  isLast,
}: {
  data?: {
    ticketsReceived: number;
    ticketsClosed: number;
    msgReceived: number;
    msgSent: number;
  };
  bgClass: string;
  isLast: boolean;
}) {
  const border = isLast ? "" : "border-r border-gray-200";
  if (!data) {
    return (
      <>
        <td className={`px-2 py-2 text-right text-gray-300 ${bgClass}`}>0</td>
        <td className={`px-2 py-2 text-right text-gray-300 ${bgClass}`}>0</td>
        <td className={`px-2 py-2 text-right text-gray-300 ${bgClass}`}>0</td>
        <td className={`px-2 py-2 text-right text-gray-300 ${bgClass} ${border}`}>
          0
        </td>
      </>
    );
  }
  return (
    <>
      <td className={`px-2 py-2 text-right text-gray-700 tabular-nums ${bgClass}`}>
        {data.ticketsReceived}
      </td>
      <td className={`px-2 py-2 text-right text-gray-700 tabular-nums ${bgClass}`}>
        {data.ticketsClosed}
      </td>
      <td className={`px-2 py-2 text-right text-gray-700 tabular-nums ${bgClass}`}>
        {data.msgReceived}
      </td>
      <td
        className={`px-2 py-2 text-right text-gray-700 tabular-nums ${bgClass} ${border}`}
      >
        {data.msgSent}
      </td>
    </>
  );
}
