"use client";

import React from "react";

import type { CallScorecard } from "@/lib/types";
import Image from "next/image";

interface ScorecardTableProps {
  title: string;
  userData: CallScorecard[];
  companyData: CallScorecard[];
}

function formatDate(d: string) {
  if (!d) return "—";
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

function UserAvatar({ src, name }: { src: string; name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (src) {
    return (
      <Image src={src} alt={name} width={20} height={20}
        className="w-5 h-5 rounded-full object-cover flex-shrink-0 inline-block mr-1" unoptimized />
    );
  }
  return (
    <span className="w-5 h-5 rounded-full bg-gray-200 inline-flex items-center justify-center flex-shrink-0 mr-1">
      <span className="text-[8px] font-medium text-gray-500">{initials}</span>
    </span>
  );
}

// Build weekly pivot
interface WeekData {
  startDate: string;
  endDate: string;
  company: { totalTix: number; avgDay: number; msgsRecv: number; msgsSent: number };
  users: Record<string, { closed: number; msgs: number; day: number; hour: number }>;
}

function pivotByWeek(userData: CallScorecard[], companyData: CallScorecard[]) {
  const users = Array.from(new Set(userData.map((r) => r.user).filter(Boolean))).sort();

  const weekMap = new Map<string, WeekData>();

  // Process company rows
  for (const row of companyData) {
    const key = row.startDate;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        startDate: row.startDate,
        endDate: row.endDate,
        company: { totalTix: 0, avgDay: 0, msgsRecv: 0, msgsSent: 0 },
        users: {},
      });
    }
    const w = weekMap.get(key)!;
    w.company.totalTix += row.totalTicketsReceived;
    w.company.msgsRecv += row.messagesReceived;
    w.company.msgsSent += row.messagesSent;
  }

  // Calculate avg/day for company
  for (const w of weekMap.values()) {
    w.company.avgDay = w.company.totalTix / 5;
  }

  // Process user rows
  for (const row of userData) {
    const key = row.startDate;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        startDate: row.startDate,
        endDate: row.endDate,
        company: { totalTix: 0, avgDay: 0, msgsRecv: 0, msgsSent: 0 },
        users: {},
      });
    }
    const w = weekMap.get(key)!;
    const userName = row.user || "Unknown";
    if (!w.users[userName]) {
      w.users[userName] = { closed: 0, msgs: 0, day: 0, hour: 0 };
    }
    const totalMsgs = row.messagesReceived + row.messagesSent;
    w.users[userName].closed += row.totalTicketsClosed;
    w.users[userName].msgs += totalMsgs;
    w.users[userName].day = w.users[userName].msgs / 5;
    w.users[userName].hour = w.users[userName].msgs / 40;
  }

  const weeks = Array.from(weekMap.values()).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return { users, weeks };
}

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

// Get user images from userData
function getUserImages(data: CallScorecard[]): Map<string, string> {
  const map = new Map<string, string>();
  // CallScorecard doesn't have image field; we'll use initials only
  return map;
}

export default function ScorecardTable({ title, userData, companyData }: ScorecardTableProps) {
  if (userData.length === 0 && companyData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  const { users, weeks } = pivotByWeek(userData, companyData);
  getUserImages(userData);

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
                colSpan={2}
                className="px-3 py-2 text-center font-semibold text-gray-500 bg-gray-50 border-b border-r border-gray-200"
              >
                Period
              </th>
              <th
                colSpan={4}
                className="px-3 py-2 text-center font-semibold bg-gray-900 text-white border-b border-r border-gray-200"
              >
                Company
              </th>
              {users.map((user, i) => (
                <th
                  key={user}
                  colSpan={4}
                  className={`px-3 py-2 text-center font-semibold border-b border-r border-gray-200 ${
                    userColors[i % userColors.length].header
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <UserAvatar src="" name={user} />
                    {user}
                  </span>
                </th>
              ))}
            </tr>
            {/* Sub-headers */}
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2 text-left font-medium text-gray-500 bg-gray-50 border-r border-gray-100 whitespace-nowrap">
                Start
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                End
              </th>
              {/* Company sub-headers */}
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Total Tix
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Avg/Day
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Msgs/Rec
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                Msgs/Sent
              </th>
              {/* User sub-headers */}
              {users.map((user, i) => (
                <React.Fragment key={user}>
                  <th className={`px-3 py-2 text-center font-medium whitespace-nowrap ${userColors[i % userColors.length].bg}`}>
                    Closed
                  </th>
                  <th className={`px-3 py-2 text-center font-medium whitespace-nowrap ${userColors[i % userColors.length].bg}`}>
                    Msgs
                  </th>
                  <th className={`px-3 py-2 text-center font-medium whitespace-nowrap ${userColors[i % userColors.length].bg}`}>
                    Day
                  </th>
                  <th className={`px-3 py-2 text-center font-medium whitespace-nowrap border-r border-gray-200 ${userColors[i % userColors.length].bg}`}>
                    Hour
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.startDate} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-100 tabular-nums">
                  {formatDate(week.startDate)}
                </td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-200 tabular-nums">
                  {formatDate(week.endDate)}
                </td>
                {/* Company cells */}
                <td className="px-3 py-2 text-center text-gray-900 font-medium tabular-nums">
                  {week.company.totalTix.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-center text-gray-500 tabular-nums">
                  {week.company.avgDay.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                  {week.company.msgsRecv.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-center text-gray-700 tabular-nums border-r border-gray-200">
                  {week.company.msgsSent.toLocaleString()}
                </td>
                {/* User cells */}
                {users.map((user, i) => {
                  const u = week.users[user] || { closed: 0, msgs: 0, day: 0, hour: 0 };
                  return (
                    <React.Fragment key={user}>
                      <td className={`px-3 py-2 text-center tabular-nums ${userColors[i % userColors.length].bg}`}>
                        {u.closed}
                      </td>
                      <td className={`px-3 py-2 text-center tabular-nums ${userColors[i % userColors.length].bg}`}>
                        {u.msgs.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 text-center text-gray-500 tabular-nums ${userColors[i % userColors.length].bg}`}>
                        {Math.round(u.day).toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 text-center text-gray-500 tabular-nums border-r border-gray-200 ${userColors[i % userColors.length].bg}`}>
                        {Math.round(u.hour).toLocaleString()}
                      </td>
                    </React.Fragment>
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
