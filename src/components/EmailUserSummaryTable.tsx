"use client";

import React from "react";
import type { CallScorecard } from "@/lib/types";
import Image from "next/image";

interface EmailUserSummaryProps {
  data: CallScorecard[];
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
    <span className="w-7 h-7 rounded-full bg-gray-200 inline-flex items-center justify-center flex-shrink-0">
      <span className="text-[9px] font-medium text-gray-500">{initials}</span>
    </span>
  );
}

interface UserAgg {
  user: string;
  image: string;
  totalTicketsReceived: number;
  totalTicketsClosed: number;
  messagesReceived: number;
  messagesSent: number;
}

function aggregateByUser(data: CallScorecard[]): UserAgg[] {
  const map = new Map<string, UserAgg>();
  for (const row of data) {
    const name = row.user || "Unknown";
    if (!map.has(name)) {
      map.set(name, {
        user: name,
        image: row.image || "",
        totalTicketsReceived: 0,
        totalTicketsClosed: 0,
        messagesReceived: 0,
        messagesSent: 0,
      });
    }
    const agg = map.get(name)!;
    agg.totalTicketsReceived += row.totalTicketsReceived;
    agg.totalTicketsClosed += row.totalTicketsClosed;
    agg.messagesReceived += row.messagesReceived;
    agg.messagesSent += row.messagesSent;
    if (!agg.image && row.image) agg.image = row.image;
  }
  return Array.from(map.values()).sort((a, b) => a.user.localeCompare(b.user));
}

export default function EmailUserSummaryTable({ data }: EmailUserSummaryProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Activities by Users</h3>
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  const rows = aggregateByUser(data);

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      totalTicketsReceived: acc.totalTicketsReceived + r.totalTicketsReceived,
      totalTicketsClosed: acc.totalTicketsClosed + r.totalTicketsClosed,
      messagesReceived: acc.messagesReceived + r.messagesReceived,
      messagesSent: acc.messagesSent + r.messagesSent,
    }),
    { totalTicketsReceived: 0, totalTicketsClosed: 0, messagesReceived: 0, messagesSent: 0 }
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Activities by Users</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            {/* Group headers */}
            <tr>
              <th
                rowSpan={2}
                className="px-3 py-2 text-left font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200 whitespace-nowrap"
              >
                User
              </th>
              <th
                colSpan={2}
                className="px-3 py-2 text-center font-semibold bg-gray-100 text-gray-700 border-b border-r border-gray-200"
              >
                Tickets
              </th>
              <th
                colSpan={2}
                className="px-3 py-2 text-center font-semibold bg-gray-100 text-gray-700 border-b border-gray-200"
              >
                Messages
              </th>
            </tr>
            {/* Sub-headers */}
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Received
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                Closed
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Received
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-500 bg-gray-50 whitespace-nowrap">
                Sent
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar src={row.image} name={row.user} />
                    <span className="text-gray-900 font-medium text-xs">{row.user}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-800 tabular-nums">
                  {row.totalTicketsReceived.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-800 tabular-nums border-r border-gray-200">
                  {row.totalTicketsClosed.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-800 tabular-nums">
                  {row.messagesReceived.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-800 tabular-nums">
                  {row.messagesSent.toLocaleString()}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
              <td className="px-3 py-2.5 text-gray-900 border-r border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7" />
                  <span className="text-xs">Total</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center text-gray-900 tabular-nums">
                {totals.totalTicketsReceived.toLocaleString()}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-900 tabular-nums border-r border-gray-200">
                {totals.totalTicketsClosed.toLocaleString()}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-900 tabular-nums">
                {totals.messagesReceived.toLocaleString()}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-900 tabular-nums">
                {totals.messagesSent.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
