"use client";

import { useEffect } from "react";

interface RegisterRedirectProps {
  callbackUrl: string;
}

export function RegisterRedirect({ callbackUrl }: RegisterRedirectProps) {
  useEffect(() => {
    if (callbackUrl) {
      const callbackUrlObj = new URL(callbackUrl);
      const currentOrigin = window.location.origin;

      if (callbackUrlObj.origin !== currentOrigin) {
        console.log("Invalid callback URL:", callbackUrl);
        localStorage.setItem("egapro_callback_url", callbackUrlObj.pathname);
      }
    }
  }, [callbackUrl]);

  return null;
}
