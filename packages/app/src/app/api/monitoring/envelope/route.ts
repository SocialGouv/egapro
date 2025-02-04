import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sentryUrl = process.env.SENTRY_URL;
  if (!sentryUrl) {
    console.error("Sentry URL not configured");
    return new Response("Sentry URL not configured", { status: 500 });
  }

  try {
    // Get and parse the request body first to extract DSN
    const body = await request.text();
    console.log("Received envelope body:", body.slice(0, 500) + (body.length > 500 ? "..." : ""));

    // Parse envelope format (newline-delimited JSON)
    let projectId: string | undefined;
    let publicKey: string | undefined;
    let envelopeDsn: string | undefined;

    try {
      const [header] = body.split("\n").filter(Boolean);
      const envelopeHeader = JSON.parse(header);

      // Try to get DSN from envelope first
      envelopeDsn = envelopeHeader.dsn;
      if (envelopeDsn) {
        try {
          const dsnUrl = new URL(envelopeDsn);
          projectId = dsnUrl.pathname.split("/")[1];
          publicKey = dsnUrl.username;
          console.log("Parsed DSN from envelope:", { projectId, publicKey });
        } catch (e) {
          console.warn("Could not parse envelope DSN:", e);
        }
      }
    } catch (e) {
      console.warn("Could not parse envelope:", e);
    }

    // Fallback to environment DSN if needed
    if (!projectId || !publicKey) {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (dsn) {
        try {
          const dsnUrl = new URL(dsn);
          projectId = dsnUrl.pathname.split("/")[1];
          publicKey = dsnUrl.username;
          console.log("Parsed DSN from environment:", { projectId, publicKey });
        } catch (e) {
          console.warn("Could not parse environment DSN:", e);
        }
      }
    }

    if (!projectId || !publicKey) {
      console.warn("Could not extract project details from DSN");
      return new Response("Could not parse Sentry DSN", { status: 500 });
    }

    // Get origin for CORS headers
    const origin = request.headers.get("origin");

    // Forward the request to Sentry's envelope endpoint
    const sentryResponse = await fetch(`${sentryUrl}/api/${projectId}/envelope/`, {
      method: "POST",
      credentials: "omit", // Don't send cookies for client-side error reporting
      headers: {
        // Forward original headers needed for client error reporting
        "Content-Type": "text/plain;charset=UTF-8",
        Accept: "*/*",
        // Forward original auth header from client request
        "X-Sentry-Auth":
          request.headers.get("X-Sentry-Auth") ||
          `Sentry sentry_key=${publicKey},sentry_version=7,sentry_client=sentry.javascript.nextjs/8.0.0`,
      },
      // Use the original request body without modifications
      body,
    });

    if (sentryResponse.status === 403) {
      console.error("Sentry authentication failed:", {
        responseStatus: sentryResponse.status,
        responseStatusText: sentryResponse.statusText,
        sentryError: sentryResponse.headers.get("X-Sentry-Error"),
        url: `${sentryUrl}/api/${projectId}/envelope/`,
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
    const sentryHeaders = ["X-Sentry-Error", "X-Sentry-Rate-Limits", "Retry-After"];

    // Get the request origin or default to *
    const requestOrigin = request.headers.get("origin") || "*";

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/plain;charset=UTF-8",
      "Access-Control-Allow-Origin": requestOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
      // Add Vary header when using dynamic origin
      ...(requestOrigin !== "*" ? { Vary: "Origin" } : {}),
    };

    // Forward specific Sentry headers if they exist
    for (const header of sentryHeaders) {
      const value = sentryResponse.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
        console.log(`Forwarding header ${header}:`, value);
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
export async function OPTIONS(request: NextRequest) {
  // Get the request origin or default to *
  const requestOrigin = request.headers.get("origin") || "*";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Accept, Content-Type, X-Sentry-Auth",
    "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
    "Access-Control-Max-Age": "86400",
  };

  // Add Vary header when using dynamic origin
  if (requestOrigin !== "*") {
    headers["Vary"] = "Origin";
  }

  return new Response(null, {
    status: 200,
    headers,
  });
}
