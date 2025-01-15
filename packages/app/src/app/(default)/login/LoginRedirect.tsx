"use client";

import { type Session } from "next-auth";
import { useEffect } from "react";

function getUriFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const uri = `${url.pathname}${url.search}${url.hash}`;
    return uri;
  } catch (error) {
    console.error("Invalid URL:", error);
    return "";
  }
}

interface LoginRedirectProps {
  callbackUrl: string;
  session: Session | null;
}

export function LoginRedirect({ session, callbackUrl }: LoginRedirectProps) {
  useEffect(() => {
    if (callbackUrl) {
      localStorage.setItem("egapro_callback_url", callbackUrl);
    }
  }, [callbackUrl]);

  useEffect(() => {
    if (session?.user) {
      const savedCallbackUrl = localStorage.getItem("egapro_callback_url");
      const redirectUrl = savedCallbackUrl ? getUriFromUrl(savedCallbackUrl) : "/";
      localStorage.removeItem("egapro_callback_url");
      window.location.href = redirectUrl;
    }
  }, [session?.user]);

  return null;
}
