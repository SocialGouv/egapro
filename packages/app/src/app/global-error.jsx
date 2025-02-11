"use client";

import { captureError } from "@common/error";
import Error from "next/error";
import { useEffect } from "react";

// eslint-disable-next-line import/no-default-export
export default function GlobalError({ error }) {
  useEffect(() => {
    captureError(error, {
      type: "client",
      url: window.location.href,
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <html>
      <body>
        <Error />
      </body>
    </html>
  );
}
