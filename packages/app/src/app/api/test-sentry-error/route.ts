import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldError = searchParams.get("trigger") === "true";

  if (shouldError) {
    // Only throw error when specifically requested
    throw new Error("Test server-side error for Sentry integration");
  }

  return NextResponse.json({ message: "Test endpoint - add ?trigger=true to trigger error" });
}
