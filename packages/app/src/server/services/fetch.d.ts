import type { Dispatcher } from "undici";

// `dispatcher` is an undici extension to `fetch` that the DOM lib does not
// know about. Declaring it here lets `suitClient.ts` pass its mTLS agent
// without casting the init object.
declare global {
	interface RequestInit {
		dispatcher?: Dispatcher;
	}
}
