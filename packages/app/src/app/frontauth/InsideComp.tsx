"use client";

import { signOut, useSession } from "next-auth/react";

export const InsideComp = () => {
  const session = useSession();
  return (
    <>
      {JSON.stringify(session, null, 2)}
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
