// Room for a session replay segment, the largest item our front sends; anything bigger is not ours.
// Kept out of route.ts: a Next.js route file may only export its handlers and route options.
export const MAX_ENVELOPE_BYTES = 10 * 1024 * 1024;
