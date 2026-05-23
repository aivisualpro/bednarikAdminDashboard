"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ScorecardResponse, EmailScorecard, CallScorecard } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import DataTable, { type Column } from "@/components/DataTable";
import ChartSection from "@/components/ChartSection";
import DateRangePicker from "@/components/DateRangePicker";
import ScorecardTable from "@/components/ScorecardTable";
import CallsScorecardTable from "@/components/CallsScorecardTable";
import CallsTrendChart from "@/components/CallsTrendChart";
import UserSummaryTable from "@/components/UserSummaryTable";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatMinutes(totalSeconds: number): string {
  if (!totalSeconds) return "0m";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

// Default to current month
function getDefaultDates() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

// ── Column defs ───────────────────────────────────────────────────────────────
const emailColumns: Column<EmailScorecard>[] = [
  { key: "user", label: "User" },
  { key: "callsTotal", label: "Total Calls", align: "right" },
  { key: "callsAnsweredTotal", label: "Answered", align: "right" },
  { key: "callsOutbound", label: "Outbound", align: "right" },
  {
    key: "totalTimeOnCalls",
    label: "Time on Calls",
    align: "right",
    render: (val) => formatMinutes(val as number),
  },
  { key: "textSentTotal", label: "Texts Sent", align: "right" },
];

const callColumns: Column<CallScorecard>[] = [
  { key: "user", label: "User" },
  { key: "type", label: "Type" },
  { key: "startDate", label: "Start Date" },
  { key: "totalTicketsReceived", label: "Tickets Recv", align: "right" },
  { key: "totalTicketsClosed", label: "Tickets Closed", align: "right" },
  {
    key: "averageTicketsDay",
    label: "Avg/Day",
    align: "right",
    render: (val) => (val as number).toFixed(1),
  },
  { key: "messagesReceived", label: "Msgs Recv", align: "right" },
  { key: "messagesSent", label: "Msgs Sent", align: "right" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * Calculate the previous period of equal duration.
 * e.g. if selected is Jan 15 → Mar 15 (59 days), prev is Nov 16 → Jan 14.
 */
function getPreviousPeriod(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const durationMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 86400000); // day before from
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(prevFrom), to: fmt(prevTo) };
}

export default function DashboardPage() {
  const defaults = getDefaultDates();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [data, setData] = useState<ScorecardResponse | null>(null);
  const [prevData, setPrevData] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetched = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prev = getPreviousPeriod(dateFrom, dateTo);
      const [res, prevRes] = await Promise.all([
        fetch(`/api/scorecard?dateFrom=${dateFrom}&dateTo=${dateTo}`),
        fetch(`/api/scorecard?dateFrom=${prev.from}&dateTo=${prev.to}`),
      ]);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to fetch data");
      }
      const json: ScorecardResponse = await res.json();
      setData(json);
      if (prevRes.ok) {
        const prevJson: ScorecardResponse = await prevRes.json();
        setPrevData(prevJson);
      } else {
        setPrevData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // ── Read URL query params & auto-fetch ──────────────────────────────────
  useEffect(() => {
    if (autoFetched.current) return;
    const params = new URLSearchParams(window.location.search);
    const qFrom = params.get("dateFrom");
    const qTo = params.get("dateTo");
    if (qFrom && qTo) {
      // Convert MM/DD/YYYY → YYYY-MM-DD if needed
      const toIso = (d: string) => {
        const slash = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slash) {
          return `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
        }
        return d; // already YYYY-MM-DD
      };
      const isoFrom = toIso(qFrom);
      const isoTo = toIso(qTo);
      setDateFrom(isoFrom);
      setDateTo(isoTo);
      autoFetched.current = true;
    }
  }, []);

  // Auto-fetch after URL params are set
  useEffect(() => {
    if (autoFetched.current && !data && !loading) {
      fetchData();
    }
  }, [dateFrom, dateTo, data, loading, fetchData]);

  // ── Aggregated KPIs ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!data) return null;
    const { emails, calls } = data;

    const totalCalls = emails.reduce((s, r) => s + r.callsTotal, 0);
    const totalAnswered = emails.reduce((s, r) => s + r.callsAnsweredTotal, 0);
    const totalMissed = emails.reduce((s, r) => s + r.callsMissed, 0);
    const totalOutbound = emails.reduce((s, r) => s + r.callsOutbound, 0);
    const totalTime = emails.reduce((s, r) => s + r.totalTimeOnCalls, 0);
    const totalTextsSent = emails.reduce((s, r) => s + r.textSentTotal, 0);
    const totalTextsRecv = emails.reduce((s, r) => s + r.textReceivedTotal, 0);
    const totalTicketsRecv = calls.reduce((s, r) => s + r.totalTicketsReceived, 0);
    const totalTicketsClosed = calls.reduce((s, r) => s + r.totalTicketsClosed, 0);
    const totalMsgsSent = calls.reduce((s, r) => s + r.messagesSent, 0);
    const totalMsgsRecv = calls.reduce((s, r) => s + r.messagesReceived, 0);
    const avgTicketsDay =
      calls.length > 0
        ? calls.reduce((s, r) => s + r.averageTicketsDay, 0) / calls.length
        : 0;

    return {
      totalCalls,
      totalAnswered,
      totalMissed,
      totalOutbound,
      totalTime,
      totalTextsSent,
      totalTextsRecv,
      totalTicketsRecv,
      totalTicketsClosed,
      totalMsgsSent,
      totalMsgsRecv,
      avgTicketsDay,
      answerRate: pct(totalAnswered, totalCalls),
      missRate: pct(totalMissed, totalCalls),
      closeRate: pct(totalTicketsClosed, totalTicketsRecv),
    };
  }, [data]);

  // ── Chart data ──────────────────────────────────────────────────────────
  const callsChartData = useMemo(() => {
    if (!data) return [];
    const byUser: Record<
      string,
      { user: string; total: number; answered: number; outbound: number; textsSent: number }
    > = {};
    for (const row of data.emails) {
      const name = row.user || "Unknown";
      if (!byUser[name])
        byUser[name] = { user: name, total: 0, answered: 0, outbound: 0, textsSent: 0 };
      byUser[name].total += row.callsTotal;
      byUser[name].answered += row.callsAnsweredTotal;
      byUser[name].outbound += row.callsOutbound;
      byUser[name].textsSent += row.textSentTotal;
    }
    return Object.values(byUser);
  }, [data]);

  const ticketsChartData = useMemo(() => {
    if (!data) return [];
    const byUser: Record<
      string,
      { user: string; received: number; closed: number }
    > = {};
    for (const row of data.calls) {
      const name = row.user || "Unknown";
      if (!byUser[name])
        byUser[name] = { user: name, received: 0, closed: 0 };
      byUser[name].received += row.totalTicketsReceived;
      byUser[name].closed += row.totalTicketsClosed;
    }
    return Object.values(byUser);
  }, [data]);

  const messagesChartData = useMemo(() => {
    if (!data) return [];
    const byUser: Record<
      string,
      { user: string; textsSent: number }
    > = {};
    for (const row of data.emails) {
      const name = row.user || "Unknown";
      if (!byUser[name])
        byUser[name] = { user: name, textsSent: 0 };
      byUser[name].textsSent += row.textSentTotal;
    }
    return Object.values(byUser);
  }, [data]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Admin Scorecard
            </h1>
          </div>
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onApply={fetchData}
            loading={loading}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-gray-900 mb-1">
              Select a date range
            </h2>
            <p className="text-xs text-gray-500 max-w-sm">
              Choose a start and end date above, then click Apply to load
              scorecard data from Google Sheets.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-lg px-5 py-4 h-20"
                >
                  <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
                  <div className="h-6 w-12 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg h-80" />
              <div className="bg-white border border-gray-200 rounded-lg h-80" />
            </div>
          </div>
        )}

        {/* Dashboard content */}
        {data && kpis && !loading && (
          <>
            {/* KPI Cards */}
            <section>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                <KpiCard
                  label="Total Calls"
                  value={kpis.totalCalls.toLocaleString()}
                />
                <KpiCard
                  label="Answered"
                  value={kpis.totalAnswered.toLocaleString()}
                  subtitle={kpis.answerRate}
                  trend="up"
                />
                <KpiCard
                  label="Missed"
                  value={kpis.totalMissed.toLocaleString()}
                  subtitle={kpis.missRate}
                  trend="down"
                />
                <KpiCard
                  label="Outbound"
                  value={kpis.totalOutbound.toLocaleString()}
                />
                <KpiCard
                  label="Time on Calls"
                  value={formatMinutes(kpis.totalTime)}
                />
                <KpiCard
                  label="Texts Sent"
                  value={kpis.totalTextsSent.toLocaleString()}
                />
                <KpiCard
                  label="Texts Received"
                  value={kpis.totalTextsRecv.toLocaleString()}
                />
                <KpiCard
                  label="Tickets Received"
                  value={kpis.totalTicketsRecv.toLocaleString()}
                />
                <KpiCard
                  label="Tickets Closed"
                  value={kpis.totalTicketsClosed.toLocaleString()}
                  subtitle={kpis.closeRate}
                  trend="up"
                />
                <KpiCard
                  label="Avg Tickets / Day"
                  value={kpis.avgTicketsDay.toFixed(1)}
                />
              </div>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <ChartSection
                title="Calls Breakdown by User"
                data={callsChartData}
                xAxisKey="user"
                bars={[
                  { dataKey: "total", label: "Total Calls", color: "#111827" },
                  { dataKey: "answered", label: "Answered", color: "#059669" },
                  { dataKey: "outbound", label: "Outbound", color: "#6B7280" },
                  { dataKey: "textsSent", label: "Texts Sent", color: "#2563EB" },
                ]}
              />
              <ChartSection
                title="Tickets by User"
                data={ticketsChartData}
                xAxisKey="user"
                bars={[
                  { dataKey: "received", label: "Received", color: "#111827" },
                  { dataKey: "closed", label: "Closed", color: "#059669" },
                ]}
              />
            </section>

            {/* Scorecard Tables */}
            <section className="space-y-4">
              <UserSummaryTable
                title="Activities"
                data={data.emails}
                prevData={prevData?.emails}
              />
              <CallsTrendChart
                title="Call & Text Trends (Weekly)"
                data={data.emails}
              />
              <CallsScorecardTable
                title="Call & Text Scorecard"
                data={data.emails}
              />
              <ScorecardTable
                title="Ticket & Message Scorecard"
                data={data.calls}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-3 sm:py-4">
        <div className="px-3 sm:px-4 lg:px-6">
          <p className="text-xs text-gray-400">
            Admin Scorecard Dashboard ·{" "}
            {data
              ? `${data.emails.length + data.calls.length} records loaded`
              : "No data loaded"}
          </p>
        </div>
      </footer>
    </div>
  );
}
