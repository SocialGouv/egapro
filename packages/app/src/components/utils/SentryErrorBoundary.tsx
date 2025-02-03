"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type PropsWithChildren } from "react";

interface State {
  hasError: boolean;
}

export class SentryErrorBoundary extends Component<PropsWithChildren, State> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.log("Error caught by Sentry boundary:", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      },
      componentStack: errorInfo.componentStack,
    });

    // Add more context to the error
    const errorWithContext = new Error(error.message);
    errorWithContext.name = "ReactError: " + error.name;
    errorWithContext.stack = error.stack;
    errorWithContext.cause = error.cause;

    // Capture with full context
    Sentry.withScope(scope => {
      scope.setTag("mechanism", "react-error-boundary");
      scope.setTag("error.type", error.name);
      scope.setContext("react", {
        componentStack: errorInfo.componentStack,
      });
      scope.setContext("error", {
        cause: error.cause,
        originalStack: error.stack,
      });
      scope.setLevel("error");

      console.log("Sending error to Sentry...");
      const eventId = Sentry.captureException(errorWithContext);
      console.log("Error sent to Sentry with event ID:", eventId);
    });
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fr-alert fr-alert--error fr-my-3w">
          <h3 className="fr-alert__title">Une erreur est survenue</h3>
          <p>L'erreur a été signalée automatiquement à notre équipe.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
