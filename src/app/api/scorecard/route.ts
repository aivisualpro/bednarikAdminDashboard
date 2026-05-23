import { NextRequest, NextResponse } from "next/server";
import { fetchEmailScorecards, fetchCallScorecards, fetchCompanyScorecards, fetchCompanyEmailScorecards } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "Missing required query params: dateFrom, dateTo (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Basic date format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const [calls, emails, company, companyEmails] = await Promise.all([
      fetchEmailScorecards(dateFrom, dateTo),
      fetchCallScorecards(dateFrom, dateTo),
      fetchCompanyScorecards(dateFrom, dateTo),
      fetchCompanyEmailScorecards(dateFrom, dateTo),
    ]);

    return NextResponse.json({ emails, calls, company, companyEmails });
  } catch (err) {
    console.error("Scorecard API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch scorecard data" },
      { status: 500 }
    );
  }
}
