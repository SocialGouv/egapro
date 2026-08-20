export const DEFAULT_LOCK_TIMEOUT_MINUTES = 30;

export const LOCK_HEARTBEAT_INTERVAL_MS = 10_000;

/**
 * Rejection message for a declaration write attempted without holding the edit
 * lock. Shared by the tRPC lock guard, the draft autosave and the upload route
 * so the client recognises a lock conflict by value rather than by matching a
 * duplicated literal that could drift (issue #4186).
 */
export const DECLARATION_LOCK_CONFLICT_MESSAGE =
	"Déclaration verrouillée par un autre utilisateur.";
