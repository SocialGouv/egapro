import { describe, expect, it } from "vitest";

import { COLUMN_LABELS, REFERENT_TYPE_LABELS } from "../shared/constants";

describe("REFERENT_TYPE_LABELS", () => {
	it("has labels for email and url", () => {
		expect(REFERENT_TYPE_LABELS.email).toBe("Email");
		expect(REFERENT_TYPE_LABELS.url).toBe("URL");
	});
});

describe("COLUMN_LABELS", () => {
	it("has labels for all columns", () => {
		expect(COLUMN_LABELS.region).toBe("Région");
		expect(COLUMN_LABELS.county).toBe("Département");
		expect(COLUMN_LABELS.name).toBe("Nom");
		expect(COLUMN_LABELS.value).toBe("Valeur");
		expect(COLUMN_LABELS.principal).toBe("Principal");
		expect(COLUMN_LABELS.createdAt).toBe("Date de création");
	});
});
