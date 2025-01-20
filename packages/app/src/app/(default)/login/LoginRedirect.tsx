"use client";

import { useRouter } from "next/navigation";
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
  callbackUrl?: string;
  session: Session | null;
}

export function LoginRedirect({ session, callbackUrl }: LoginRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (callbackUrl) {
      const callbackUrlObj = new URL(callbackUrl);
      const currentOrigin = window.location.origin;
      if (callbackUrlObj.origin !== currentOrigin) {
        console.log("Invalid callback URL:", callbackUrl);
        localStorage.setItem("egapro_callback_url", callbackUrl);
      }
    }
  }, [callbackUrl]);

  useEffect(() => {
    const savedCallbackUrl = localStorage.getItem("egapro_callback_url");
    console.log("savedCallbackUrl", savedCallbackUrl);
    console.log("session", session);
    if (session?.user && savedCallbackUrl) {
      const redirectUrl = savedCallbackUrl ? getUriFromUrl(savedCallbackUrl) : "/";
      localStorage.removeItem("egapro_callback_url");
      router.push(redirectUrl);
    }
  }, [session?.user, router]);

  return null;
}
