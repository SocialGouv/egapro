import { type Column, ilike, type SQL } from "drizzle-orm";

// Backslash is Postgres's default LIKE escape character: user text matches literally, `_` and `%` included.
function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, "\\$&");
}

export function containsInsensitive(column: Column, value: string): SQL {
	return ilike(column, `%${escapeLikePattern(value)}%`);
}

export function startsWithInsensitive(column: Column, value: string): SQL {
	return ilike(column, `${escapeLikePattern(value)}%`);
}
