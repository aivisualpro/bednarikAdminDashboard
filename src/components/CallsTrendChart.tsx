"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { EmailScorecard } from "@/lib/types";

interface CallsTrendChartProps {
  data: EmailScorecard[];
  title: string;
}

interface WeekData {
  week: string;
  totalCalls: number;
  answered: number;
  outbound: number;
  textsSent: number;
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

function aggregateByWeek(data: EmailScorecard[]): WeekData[] {
  const weekMap = new Map<string, WeekData>();

  for (const row of data) {
    const key = row.startDate;
    const label = `${getWeekLabel(row.startDate)} – ${getWeekLabel(row.endDate)}`;

    if (!weekMap.has(key)) {
      weekMap.set(key, {
        week: label,
        totalCalls: 0,
        answered: 0,
        outbound: 0,
        textsSent: 0,
      });
    }

    const w = weekMap.get(key)!;
    w.totalCalls += row.callsTotal;
    w.answered += row.callsAnsweredTotal;
    w.outbound += row.callsOutbound;
    w.textsSent += row.textSentTotal;
  }

  // Sort by date
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export default function CallsTrendChart({ data, title }: CallsTrendChartProps) {
  const chartData = aggregateByWeek(data);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "13px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="totalCalls"
            name="Total Calls"
            stroke="#111827"
            strokeWidth={2}
            dot={{ r: 3, fill: "#111827" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="answered"
            name="Answered"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 3, fill: "#059669" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="outbound"
            name="Outbound"
            stroke="#6B7280"
            strokeWidth={2}
            dot={{ r: 3, fill: "#6B7280" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="textsSent"
            name="Texts Sent"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2563EB" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
