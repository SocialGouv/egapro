import { vi } from "vitest";

// Mock only `server-only` — the rest of the real server modules (env, db,
// audit helpers) must load untouched so the integration tests exercise the
// actual production code paths against the real Postgres container started
// by `integration-setup.ts`.
vi.mock("server-only", () => ({}));
