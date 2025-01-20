"use client";

import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { useEffect } from "react";

interface LoginRedirectProps {
  session: Session | null;
}

export function LoginRedirect({ session }: LoginRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const savedCallbackUrl = localStorage.getItem("egapro_callback_url");
    console.log("savedCallbackUrl", savedCallbackUrl);
    console.log("session", session);
    if (session?.user && savedCallbackUrl) {
      localStorage.removeItem("egapro_callback_url");
      router.push(savedCallbackUrl);
    } else return router.push("/");
  }, []);

  return null;
}
