import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sentryUrl = process.env.SENTRY_URL;
  if (!sentryUrl) {
    console.error("Sentry URL not configured");
    return new Response("Sentry URL not configured", { status: 500 });
  }

  try {
    const body = await request.text();
    let projectId: string | undefined;
    let publicKey: string | undefined;

    const lines = body.split("\n");
    if (lines.length < 2) {
      console.error("Invalid envelope format: missing parts");
      return new Response("Invalid envelope format", { status: 400 });
    }

    const headerRaw = lines[0];
    const items: string[] = [];

    let i = 1;
    while (i < lines.length) {
      const itemHeaderLine = lines[i];
      if (!itemHeaderLine || itemHeaderLine.trim() === "") {
        i++;
        continue;
      }

      try {
        const itemHeader = JSON.parse(itemHeaderLine);
        if (!itemHeader.type) {
          i++;
          continue;
        }

        const itemPayloadLines: string[] = [];
        i++;
        while (i < lines.length) {
          const payloadLine = lines[i];
          if (payloadLine.trim() === "") {
            i++;
            continue;
          }
          try {
            const parsed = JSON.parse(payloadLine);
            if (parsed.type) {
              break;
            }
          } catch (e) {
          }
          itemPayloadLines.push(payloadLine);
          i++;
        }

        if (itemPayloadLines.length > 0) {
          items.push(itemHeaderLine + "\n" + itemPayloadLines.join("\n"));
        } else {
          items.push(itemHeaderLine);
        }

      } catch (e) {
        i++;
      }
    }

    const envelope = headerRaw + "\n\n" + items.join("\n");

    try {
      const header = JSON.parse(headerRaw);

      if (header.dsn) {
        const dsnUrl = new URL(header.dsn);
        projectId = dsnUrl.pathname.split("/")[1];
        publicKey = dsnUrl.username;
      }
    } catch (e) {
      console.error("Failed to parse envelope header:", e);
      return new Response("Invalid envelope header", { status: 400 });
    }

    if (!projectId || !publicKey) {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (dsn) {
        try {
          const dsnUrl = new URL(dsn);
          projectId = dsnUrl.pathname.split("/")[1];
          publicKey = dsnUrl.username;
        } catch (e) {
          console.warn("Could not parse environment DSN:", e);
        }
      }
    }

    if (!projectId || !publicKey) {
      console.warn("Could not extract project details from DSN");
      return new Response("Could not parse Sentry DSN", { status: 500 });
    }

    const sentryResponse = await fetch(`${sentryUrl}/api/${projectId}/envelope/`, {
      method: "POST",
      credentials: "omit",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        Accept: "*/*",
        "X-Sentry-Auth":
          request.headers.get("X-Sentry-Auth") ||
          `Sentry sentry_key=${publicKey},sentry_version=7,sentry_client=sentry.javascript.nextjs/8.0.0`,
      },
      body: envelope,
    });

    if (sentryResponse.status === 403) {
      console.error("Sentry authentication failed:", {
        responseStatus: sentryResponse.status,
        responseStatusText: sentryResponse.statusText,
        sentryError: sentryResponse.headers.get("X-Sentry-Error"),
        url: `${sentryUrl}/api/${projectId}/envelope/`,
      });

      try {
        const errorBody = await sentryResponse.clone().text();
        console.error("Sentry error response body:", errorBody);
      } catch (e) {
        console.error("Could not read error response body");
      }
    }

    const sentryHeaders = ["X-Sentry-Error", "X-Sentry-Rate-Limits", "Retry-After"];

    const requestOrigin = request.headers.get("origin") || "*";

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/plain;charset=UTF-8",
      "Access-Control-Allow-Origin": requestOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
      ...(requestOrigin !== "*" ? { Vary: "Origin" } : {}),
    };

    for (const header of sentryHeaders) {
      const value = sentryResponse.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
      }
    }

    return new Response(await sentryResponse.text(), {
      status: sentryResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error forwarding to Sentry:", error);
    return new Response("Error forwarding to Sentry", { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get("origin") || "*";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Accept, Content-Type, X-Sentry-Auth",
    "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
    "Access-Control-Max-Age": "86400",
  };

  if (requestOrigin !== "*") {
    headers["Vary"] = "Origin";
  }

  return new Response(null, {
    status: 200,
    headers,
  });
}
