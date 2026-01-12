"use client";

import Error from "next/error";

// eslint-disable-next-line import/no-default-export
export default function GlobalError({ error }) {
  // useEffect(() => {
  //   captureError(error, {
  //     type: "client",
  //     url: window.location.href,
  //     path: window.location.pathname,
  //   });
  // }, [error]);

  return (
    <html>
      <body>
        <Error />
      </body>
    </html>
  );
}
