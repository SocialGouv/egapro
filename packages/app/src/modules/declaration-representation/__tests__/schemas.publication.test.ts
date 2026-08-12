import { describe, expect, it } from "vitest";

import { publicationSchema } from "~/modules/declaration-representation";
import {
	issues,
	MAX_PUBLISH_MODALITIES_LENGTH,
	MAX_PUBLISH_URL_LENGTH,
	OFFLINE_PUBLICATION,
	WEBSITE_PUBLICATION as VALID_PUBLICATION,
	VALIDATION_MESSAGES,
} from "./fixtures";

describe("publicationSchema", () => {
	it("accepts a website publication", () => {
		expect(publicationSchema.safeParse(VALID_PUBLICATION).success).toBe(true);
	});

	it.each([
		"https://exemple.fr/egalite",
		"http://exemple.fr/egalite",
		"www.exemple.fr/egalite",
		"exemple.fr",
	])("accepts the URL %s", (publishUrl) => {
		const result = publicationSchema.safeParse({
			...VALID_PUBLICATION,
			publishUrl,
		});

		expect(result.success).toBe(true);
	});

	it.each([
		"pas une url",
		"exemple",
		"https://",
	])("rejects the URL %s", (publishUrl) => {
		const result = publicationSchema.safeParse({
			...VALID_PUBLICATION,
			publishUrl,
		});

		expect(issues(result)).toContainEqual({
			path: "publishUrl",
			message: VALIDATION_MESSAGES.urlInvalid,
		});
	});

	it("rejects an empty URL", () => {
		const result = publicationSchema.safeParse({
			...VALID_PUBLICATION,
			publishUrl: "   ",
		});

		expect(issues(result)).toContainEqual({
			path: "publishUrl",
			message: VALIDATION_MESSAGES.urlRequired,
		});
	});

	it("accepts a URL of exactly the maximum length", () => {
		const prefix = "https://exemple.fr/";
		const publishUrl =
			prefix + "a".repeat(MAX_PUBLISH_URL_LENGTH - prefix.length);

		expect(publishUrl).toHaveLength(MAX_PUBLISH_URL_LENGTH);
		expect(
			publicationSchema.safeParse({ ...VALID_PUBLICATION, publishUrl }).success,
		).toBe(true);
	});

	it("rejects a URL longer than the maximum length", () => {
		const prefix = "https://exemple.fr/";
		const result = publicationSchema.safeParse({
			...VALID_PUBLICATION,
			publishUrl:
				prefix + "a".repeat(MAX_PUBLISH_URL_LENGTH - prefix.length + 1),
		});

		expect(issues(result)).toContainEqual({
			path: "publishUrl",
			message: VALIDATION_MESSAGES.urlTooLong,
		});
	});

	it("accepts publication modalities when there is no website", () => {
		expect(publicationSchema.safeParse(OFFLINE_PUBLICATION).success).toBe(true);
	});

	it("rejects empty publication modalities", () => {
		const result = publicationSchema.safeParse({
			...OFFLINE_PUBLICATION,
			publishModalities: "  ",
		});

		expect(issues(result)).toContainEqual({
			path: "publishModalities",
			message: VALIDATION_MESSAGES.modalitiesRequired,
		});
	});

	it("accepts publication modalities of exactly the maximum length", () => {
		const result = publicationSchema.safeParse({
			...OFFLINE_PUBLICATION,
			publishModalities: "a".repeat(MAX_PUBLISH_MODALITIES_LENGTH),
		});

		expect(result.success).toBe(true);
	});

	it("rejects publication modalities longer than the maximum length", () => {
		const result = publicationSchema.safeParse({
			...OFFLINE_PUBLICATION,
			publishModalities: "a".repeat(MAX_PUBLISH_MODALITIES_LENGTH + 1),
		});

		expect(issues(result)).toContainEqual({
			path: "publishModalities",
			message: VALIDATION_MESSAGES.modalitiesTooLong,
		});
	});

	it("rejects a publication date that is not an ISO calendar date", () => {
		const result = publicationSchema.safeParse({
			...VALID_PUBLICATION,
			publishDate: "01/03/2026",
		});

		expect(result.success).toBe(false);
	});
});
