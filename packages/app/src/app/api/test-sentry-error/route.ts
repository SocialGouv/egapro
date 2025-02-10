export async function GET() {
  // Deliberately throw an error to test Sentry server-side error capturing
  throw new Error("Test server-side error for Sentry integration");
}
