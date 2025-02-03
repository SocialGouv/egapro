import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sentryUrl = process.env.SENTRY_URL;
  if (!sentryUrl) {
    console.error("Sentry URL not configured");
    return new Response("Sentry URL not configured", { status: 500 });
  }

  try {
    // Get the original request URL and extract the path after /api/monitoring/envelope
    const originalUrl = new URL(request.url);
    const pathWithQuery = originalUrl.pathname.replace("/api/monitoring/envelope", "") + originalUrl.search;

    console.log("Forwarding request to Sentry:", {
      url: `${sentryUrl}${pathWithQuery}`,
      method: "POST",
      headers: Object.fromEntries(request.headers),
    });

    // Get all headers from the request
    const headers = Object.fromEntries(request.headers);
    console.log("Received headers:", headers);

    // Get the auth token
    const authToken = process.env.SENTRY_AUTH_TOKEN;
    if (!authToken) {
      console.warn("SENTRY_AUTH_TOKEN not configured");
    }

    // Get the original Sentry auth header
    const sentryAuthHeader = request.headers.get("X-Sentry-Auth");

    // Forward the request to Sentry
    const sentryResponse = await fetch(`${sentryUrl}${pathWithQuery}`, {
      method: "POST",
      headers: {
        // Forward all original headers except auth-related ones
        ...Object.fromEntries(Object.entries(headers).filter(([key]) => !key.toLowerCase().includes("auth"))),
        // Set content type
        "Content-Type": "application/x-sentry-envelope",
        // Preserve original Sentry auth header if present
        ...(sentryAuthHeader ? { "X-Sentry-Auth": sentryAuthHeader } : {}),
        // Add our auth token if available and no Sentry auth header present
        ...(authToken && !sentryAuthHeader ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: await request.text(),
    });

    if (sentryResponse.status === 403) {
      console.error("Sentry authentication failed:", {
        requestHeaders: headers,
        responseStatus: sentryResponse.status,
        responseStatusText: sentryResponse.statusText,
        sentryError: sentryResponse.headers.get("X-Sentry-Error"),
        url: `${sentryUrl}${pathWithQuery}`,
      });

      // Try to get response body for more error details
      try {
        const errorBody = await sentryResponse.clone().text();
        console.error("Sentry error response body:", errorBody);
      } catch (e) {
        console.error("Could not read error response body");
      }
    }

    console.log("Sentry response:", {
      status: sentryResponse.status,
      statusText: sentryResponse.statusText,
      error: sentryResponse.headers.get("X-Sentry-Error"),
    });

    // Get Sentry response headers we want to forward
    const sentryHeaders = ["X-Sentry-Error", "X-Sentry-Rate-Limits", "Retry-After", "X-Sentry-Auth"];

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/x-sentry-envelope",
      "Access-Control-Allow-Origin": "*",
    };

    // Forward specific Sentry headers if they exist
    for (const header of sentryHeaders) {
      const value = sentryResponse.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
      }
    }

    // Return the response from Sentry with forwarded headers
    return new Response(await sentryResponse.text(), {
      status: sentryResponse.status,
      headers: responseHeaders,
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
      "Access-Control-Allow-Headers":
        "Accept, Authorization, Content-Type, X-Sentry-Auth, X-Requested-With, X-Client-Auth, X-Client-Version, X-Client-IP",
      "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
      "Access-Control-Max-Age": "86400",
    },
  });
}
