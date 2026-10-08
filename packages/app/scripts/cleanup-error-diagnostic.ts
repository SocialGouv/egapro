export function cleanupErrorDiagnostic(error: unknown): string {
	try {
		let current = error;
		for (let depth = 0; depth < 3; depth++) {
			if (typeof current !== "object" || current === null) break;
			const details = current as Record<string, unknown>;
			if (details.code === "ECONNREFUSED") return "ECONNREFUSED";
			if (details.code === "CONNECT_TIMEOUT") return "CONNECT_TIMEOUT";
			if (
				typeof details.code === "string" &&
				/^[0-9A-Z]{5}$/.test(details.code)
			) {
				return `SQLSTATE_${details.code}`;
			}
			const metadata = details.$metadata;
			if (typeof metadata === "object" && metadata !== null) {
				const status = (metadata as Record<string, unknown>).httpStatusCode;
				if (
					typeof status === "number" &&
					Number.isInteger(status) &&
					status >= 400 &&
					status <= 599
				) {
					return `HTTP_${status}`;
				}
			}
			current = details.cause;
		}
	} catch {
		// A malformed error object must never interrupt the cleanup error path.
	}
	return "UNKNOWN";
}
