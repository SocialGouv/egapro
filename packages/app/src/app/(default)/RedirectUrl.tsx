"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const RedirectedUrl = () => {
  const routeur = useRouter();

  useEffect(() => {
    const redirectedUrl = window.sessionStorage.getItem("redirectUrl");
    if (redirectedUrl) {
      window.sessionStorage.removeItem("redirectUrl");
      routeur.push(redirectedUrl);
    }
  }, []);

  return null;
};
