afterAll(async () => {
  // Close the singleton postgres-js connection in the *same* Jest runtime.
  // This prevents the "Jest did not exit" warning.
  const { pgClient } = await import("@api/shared-domain/infra/db/drizzle");
  await pgClient.end({ timeout: 5 });
});
