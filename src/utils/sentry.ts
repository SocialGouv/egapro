import * as Sentry from "@sentry/react"

export function logToSentry(error: any, data: any) {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: data,
    })
  }
}
