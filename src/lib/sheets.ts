import { google } from "googleapis";
import type { EmailScorecard, CallScorecard } from "./types";

// ── Auth ──────────────────────────────────────────────────────────────────────
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse a duration string like "55:30:00" (H:MM:SS) into total seconds.
 * Also handles plain numbers (treated as seconds).
 */
function parseDuration(val: string | undefined): number {
  if (!val) return 0;
  // Try H:MM:SS or HH:MM:SS format
  const match = val.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  // Fallback: plain number (seconds)
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse dates in various formats: MM/DD/YYYY, YYYY-MM-DD, etc.
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try MM/DD/YYYY format first (what Google Sheets returns)
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Try YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Fallback
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isInDateRange(
  rowStartDate: string | undefined,
  dateFrom: string,
  dateTo: string
): boolean {
  if (!rowStartDate) return false;
  const row = parseDate(rowStartDate);
  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (!row || !from || !to) return false;
  // Set to end of day
  to.setHours(23, 59, 59, 999);
  return row >= from && row <= to;
}

// ── Fetch AdminScorecardEmails (ticket & message data) ────────────────────────
// Actual column order: _id, startDate, endDate, type, userId, user,
//   totalTicketsReceived, totalTicketsClosed,
//   messagesReceived, messagesSent, image

function mapEmailRow(row: string[]): CallScorecard {
  return {
    _id: row[0] || "",
    startDate: row[1] || "",
    endDate: row[2] || "",
    type: row[3] || "",
    userId: row[4] || "",
    user: row[5] || "",
    totalTicketsReceived: parseNumber(row[6]),
    totalTicketsClosed: parseNumber(row[7]),
    messagesReceived: parseNumber(row[8]),
    messagesSent: parseNumber(row[9]),
    image: row[10] || "",
  };
}

async function fetchAllEmailRows(dateFrom: string, dateTo: string) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "AdminScorecardEmails!A:K",
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return { user: [], company: [] };

  const filtered = rows.slice(1).filter((row) => isInDateRange(row[1], dateFrom, dateTo));

  return {
    user: filtered.filter((r) => (r[3] || "").toLowerCase() === "user").map(mapEmailRow),
    company: filtered.filter((r) => (r[3] || "").toLowerCase() === "company").map(mapEmailRow),
  };
}

export async function fetchEmailScorecards(dateFrom: string, dateTo: string): Promise<CallScorecard[]> {
  const { user } = await fetchAllEmailRows(dateFrom, dateTo);
  return user;
}

export async function fetchCompanyEmailScorecards(dateFrom: string, dateTo: string): Promise<CallScorecard[]> {
  const { company } = await fetchAllEmailRows(dateFrom, dateTo);
  return company;
}

// ── Fetch AdminScorecardCalls (call & text data) ──────────────────────────────
// Actual column order: _id, startDate, endDate, type, userId, user,
//   callsTotal, callsMissed, callsMissedUnanswered, callsMissedAbandoned,
//   callsAnsweredTotal, callsAnsweredTeamMember, callsAnsweredSona,
//   callsOutbound, totalTimeOnCalls, textSentTotal, textReceivedTotal, Image

function mapCallRow(row: string[]): EmailScorecard {
  return {
    _id: row[0] || "",
    startDate: row[1] || "",
    endDate: row[2] || "",
    type: row[3] || "",
    userId: row[4] || "",
    user: row[5] || "",
    callsTotal: parseNumber(row[6]),
    callsMissed: parseNumber(row[7]),
    callsMissedUnanswered: parseNumber(row[8]),
    callsMissedAbandoned: parseNumber(row[9]),
    callsAnsweredTotal: parseNumber(row[10]),
    callsAnsweredTeamMember: parseNumber(row[11]),
    callsAnsweredSona: parseNumber(row[12]),
    callsOutbound: parseNumber(row[13]),
    totalTimeOnCalls: parseDuration(row[14]),
    textSentTotal: parseNumber(row[15]),
    textReceivedTotal: parseNumber(row[16]),
    image: row[17] || "",
  };
}

async function fetchAllCallRows(dateFrom: string, dateTo: string) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "AdminScorecardCalls!A:R",
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return { user: [], company: [] };

  const filtered = rows.slice(1).filter((row) => isInDateRange(row[1], dateFrom, dateTo));

  return {
    user: filtered.filter((r) => (r[3] || "").toLowerCase() === "user").map(mapCallRow),
    company: filtered.filter((r) => (r[3] || "").toLowerCase() === "company").map(mapCallRow),
  };
}

export async function fetchCallScorecards(dateFrom: string, dateTo: string): Promise<EmailScorecard[]> {
  const { user } = await fetchAllCallRows(dateFrom, dateTo);
  return user;
}

export async function fetchCompanyScorecards(dateFrom: string, dateTo: string): Promise<EmailScorecard[]> {
  const { company } = await fetchAllCallRows(dateFrom, dateTo);
  return company;
}

