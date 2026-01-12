// import * as Sentry from "@sentry/nextjs";

type ErrorType = "api" | "client" | "middleware" | "server";

interface RequestContext {
  method?: string;
  path?: string;
  url?: string;
}

export interface ErrorContext extends RequestContext {
  [key: string]: unknown;
  type: ErrorType;
}

export function captureError(error: unknown, context: ErrorContext): Error {
  // Ensure we have an Error object
  const errorObject = error instanceof Error ? error : new Error(String(error));

  // Sentry.captureException(errorObject, {
  //   contexts,
  //   tags: {
  //     errorType: context.type,
  //     framework: "next.js",
  //   },
  // });

  return errorObject;
}

export function withErrorHandler<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => Promise<TReturn>,
  context: Omit<ErrorContext, "type">,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await handler(...args);
    } catch (error) {
      captureError(error, { ...context, type: "api" });
      throw error;
    }
  };
}
