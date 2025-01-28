"use client";

import { useCallback } from "react";

export const SentryTest = () => {
  const triggerError = useCallback(() => {
    console.log({
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
    const error = new Error("Test error for Sentry integration");
    error.name = "SentryTestError";
    throw error;
  }, []);

  return <div onClick={triggerError}>Trigger Sentry test error</div>;
};
