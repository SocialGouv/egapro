"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const RedirectedUrl = () => {
  const routeur = useRouter();
  const redirectedUrl = window.sessionStorage.getItem("redirectUrl");
  useEffect(() => {
    if (redirectedUrl) {
      window.sessionStorage.removeItem("redirectUrl");
      routeur.push(redirectedUrl);
    }
  }, [redirectedUrl]);

  return null;
};
