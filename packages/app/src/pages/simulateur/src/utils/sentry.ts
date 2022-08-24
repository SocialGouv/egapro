import * as Sentry from "@sentry/react"

export function logToSentry(error: any, data: any): void {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: data,
    })
  }
}
