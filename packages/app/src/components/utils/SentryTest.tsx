"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useCallback, useEffect, useState } from "react";

export const SentryTest = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;
      const newText = typedText + event.key.toLowerCase();
      setTypedText(newText.slice(-6)); // Keep only last 6 characters

      if (newText.endsWith("sentry")) {
        setIsVisible(true);
        console.log("Sentry test activated!");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [typedText]);

  const triggerError = useCallback(() => {
    // Log configuration and start of error test
    console.log("Starting Sentry test with config:", {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,
    });

    console.log("Triggering test error - this should be caught by the error boundary...");

    // Create and throw an error that will be caught by the error boundary
    try {
      // Create an error with a stack trace by actually throwing it
      throw new Error("Test error for Sentry integration");
    } catch (e) {
      const error = e as Error;
      error.name = "SentryTestError";
      error.cause = "Manual test trigger";
      throw error;
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fr-container fr-py-3w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Button onClick={triggerError}>Trigger client-side error</Button>
        </div>
      </div>
    </div>
  );
};
