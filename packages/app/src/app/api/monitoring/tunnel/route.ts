import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sentryUrl = process.env.SENTRY_URL;
  if (!sentryUrl) {
    return new Response("Sentry URL not configured", { status: 500 });
  }

  try {
    // Forward the request to Sentry
    const sentryResponse = await fetch(`${sentryUrl}/api/34/envelope/`, {
      method: "POST",
      headers: {
        ...Object.fromEntries(request.headers),
        "Content-Type": "application/x-sentry-envelope",
      },
      body: await request.text(),
    });

    // Return the response from Sentry
    return new Response(await sentryResponse.text(), {
      status: sentryResponse.status,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error forwarding to Sentry:", error);
    return new Response("Error forwarding to Sentry", { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Sentry-Auth",
      "Access-Control-Max-Age": "86400",
    },
  });
}
