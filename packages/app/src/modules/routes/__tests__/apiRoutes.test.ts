import { describe, expect, it } from "vitest";
import {
	API_DECLARATION_PDF,
	API_SEARCH,
	API_TRPC,
	API_UPLOAD,
	API_V1_FILES,
	API_V1_PREFIX,
	apiV1FileHref,
} from "../shared/apiRoutes";

describe("api routes", () => {
	it("spells the endpoints the app calls", () => {
		expect(API_UPLOAD).toBe("/api/upload");
		expect(API_DECLARATION_PDF).toBe("/api/declaration-pdf");
		expect(API_V1_FILES).toBe("/api/v1/files");
	});

	it("builds a file download URL", () => {
		expect(apiV1FileHref("abc-123")).toBe("/api/v1/files/abc-123");
	});

	// The middleware matches this prefix to enforce the gateway shared secret;
	// the trailing slash is what keeps `/api/v1x` out of it.
	it("keeps the gateway prefix trailing-slashed", () => {
		expect(API_V1_PREFIX).toBe("/api/v1/");
		expect(apiV1FileHref("x").startsWith(API_V1_PREFIX)).toBe(true);
	});

	it("keeps the paths Next generates no type for", () => {
		expect(API_TRPC).toBe("/api/trpc");
		expect(API_SEARCH).toBe("/api/search");
	});
});
