"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const InsideComp = ({ csrfToken }: { csrfToken?: string }) => {
  const session = useSession();
  const [callbackUrl, setCallbackUrl] = useState("");
  useEffect(() => {
    setCallbackUrl(window.location.href);
  }, []);

  return (
    <>
      {JSON.stringify(session, null, 2)}
      <br />
      <button
        onClick={async () => {
          await signOut({ redirect: false });
          console.log("LOGGED OUT");
        }}
      >
        Logout
      </button>
    </>
  );
};
