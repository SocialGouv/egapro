import { describe, expect, it } from "vitest";

import { openApiSpec } from "../openapi";

describe("openApiSpec", () => {
	it("should be a valid OpenAPI 3.1 structure", () => {
		expect(openApiSpec.openapi).toBe("3.1.0");
		expect(openApiSpec.info.title).toBeDefined();
		expect(openApiSpec.info.version).toBe("1.1.0");
		expect(openApiSpec.paths).toBeDefined();
	});

	it("should define the declarations endpoint", () => {
		const path = openApiSpec.paths["/api/v1/export/declarations"];
		expect(path).toBeDefined();
		expect(path.get).toBeDefined();
		expect(path.get.operationId).toBe("getDeclarations");
	});

	it("should require date_begin parameter", () => {
		const params =
			openApiSpec.paths["/api/v1/export/declarations"].get.parameters;
		const dateBegin = params.find((p) => p.name === "date_begin");
		expect(dateBegin).toBeDefined();
		expect(dateBegin?.required).toBe(true);
	});

	it("should make date_end optional", () => {
		const params =
			openApiSpec.paths["/api/v1/export/declarations"].get.parameters;
		const dateEnd = params.find((p) => p.name === "date_end");
		expect(dateEnd).toBeDefined();
		expect(dateEnd?.required).toBe(false);
	});

	it("should define 200, 400, and 500 responses", () => {
		const responses =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses;
		expect(responses["200"]).toBeDefined();
		expect(responses["400"]).toBeDefined();
		expect(responses["500"]).toBeDefined();
	});

	it("should have items schema on 400 details array", () => {
		const schema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["400"]
				.content["application/json"].schema;
		const details = schema.properties.details;
		expect(details.type).toBe("array");
		expect(details.items).toBeDefined();
		expect(details.items.type).toBe("object");
	});
});
