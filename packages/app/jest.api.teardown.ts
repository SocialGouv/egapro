export default async function globalTeardown() {
  // Import dynamically to avoid early evaluation issues in Jest.
  const { pgClient } = await import("@api/shared-domain/infra/db/drizzle");
  await pgClient.end({ timeout: 5 });
}
