// ── AdminScorecardEmails sheet (call & text metrics) ──────────────────────────
export interface EmailScorecard {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  userId: string;
  user: string;
  callsTotal: number;
  callsMissed: number;
  callsMissedUnanswered: number;
  callsMissedAbandoned: number;
  callsAnsweredTotal: number;
  callsAnsweredTeamMember: number;
  callsAnsweredSona: number;
  callsOutbound: number;
  totalTimeOnCalls: number;
  textSentTotal: number;
  textReceivedTotal: number;
  image: string;
}

// ── AdminScorecardCalls sheet (ticket & message metrics) ──────────────────────
export interface CallScorecard {
  _id: string;
  type: string;
  userId: string;
  user: string;
  startDate: string;
  endDate: string;
  totalTicketsReceived: number;
  totalTicketsClosed: number;
  messagesReceived: number;
  messagesSent: number;
  image: string;
}

// ── API response ──────────────────────────────────────────────────────────────
export interface ScorecardResponse {
  emails: EmailScorecard[];
  calls: CallScorecard[];
  company: EmailScorecard[];
  companyEmails: CallScorecard[];
}
