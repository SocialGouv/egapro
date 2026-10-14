import {
	defaultShouldDehydrateQuery,
	isServer,
	QueryClient,
} from "@tanstack/react-query";
import { isTRPCClientError } from "@trpc/client";
import SuperJSON from "superjson";

const MAX_CLIENT_QUERY_RETRIES = 3;

// React Query's default policy, minus 429s: retrying one only extends the quota hit.
export function shouldRetryQuery(
	failureCount: number,
	error: unknown,
): boolean {
	if (isServer) return false;
	if (isTRPCClientError(error) && error.data?.code === "TOO_MANY_REQUESTS") {
		return false;
	}
	return failureCount < MAX_CLIENT_QUERY_RETRIES;
}

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: 30 * 1000,
				retry: shouldRetryQuery,
			},
			dehydrate: {
				serializeData: SuperJSON.serialize,
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
			hydrate: {
				deserializeData: SuperJSON.deserialize,
			},
		},
	});
