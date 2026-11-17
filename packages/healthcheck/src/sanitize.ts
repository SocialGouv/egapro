const MAX_MESSAGE_LENGTH = 200;
const MIN_SECRET_LENGTH = 4;

const URL_RE = /\b([a-z][a-z0-9+.-]*:\/\/)(?:[^\s/?#@]*@)?([^/?#\s]+)[^\s]*/gi;
const LONG_TOKEN_RE = /[A-Za-z0-9+/=_-]{40,}/g;
const CONTROL_CHARS_RE = /\p{Cc}/gu;

function messageOf(error: unknown): string | null {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (typeof error === "object" && error !== null && "message" in error) {
		const { message } = error as { message: unknown };
		if (typeof message === "string") return message;
	}
	return null;
}

function codeOf(error: unknown): string | null {
	if (typeof error !== "object" || error === null || !("code" in error)) {
		return null;
	}
	const { code } = error as { code: unknown };
	return typeof code === "string" && code.length > 0 ? code : null;
}

// postgres.js raises a bare Error with an empty message and only a `code` for a
// refused connection (`AggregateError` as `String(error)`), so the code is the
// only diagnosable and leak-free thing left.
function rawMessage(error: unknown): string {
	const message = messageOf(error);
	if (message !== null && message.trim().length > 0) return message;
	return codeOf(error) ?? "unknown error";
}

export function sanitizeMessage(
	error: unknown,
	secrets: readonly string[] = [],
): string {
	let message = rawMessage(error);

	for (const secret of secrets) {
		if (secret.length < MIN_SECRET_LENGTH) continue;
		message = message.split(secret).join("[redacted]");
	}

	message = message
		.replace(URL_RE, "$1$2")
		.replace(LONG_TOKEN_RE, "[redacted]")
		.replace(CONTROL_CHARS_RE, " ")
		.replace(/\s+/g, " ")
		.trim();

	if (message.length === 0) return "unknown error";

	return message.length > MAX_MESSAGE_LENGTH
		? `${message.slice(0, MAX_MESSAGE_LENGTH - 1)}…`
		: message;
}
