import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldError = searchParams.get("trigger") === "true";

    if (shouldError) {
      throw new Error("Test server-side error for Sentry integration");
    }

    return new NextResponse(JSON.stringify({ message: "Test endpoint - add ?trigger=true to trigger error" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    throw error;
  }
}
