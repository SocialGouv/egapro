import { describe, expect, it } from "vitest";

import { publicOpenApiSpec } from "./openapi";
import { publicDeclarationDTOSchema } from "./schemas";

const declarationSchema =
	publicOpenApiSpec.components.schemas.PublicDeclaration;

describe("publicOpenApiSpec", () => {
	it("is a valid OpenAPI 3.1 document", () => {
		expect(publicOpenApiSpec.openapi).toBe("3.1.0");
		expect(publicOpenApiSpec.info.title).toBe("EGAPRO — API publique");
		expect(publicOpenApiSpec.info.version).toBe("1.0.0");
		expect(publicOpenApiSpec.info.license?.name).toBe("Etalab 2.0");
		expect(publicOpenApiSpec.paths).toBeDefined();
	});

	it("documents the four public endpoints", () => {
		expect(Object.keys(publicOpenApiSpec.paths).sort()).toEqual([
			"/api/public/declarations",
			"/api/public/declarations/export",
			"/api/public/declarations/{siren}",
			"/api/public/declarations/{siren}/{year}",
		]);
	});

	it("exposes the three reusable component schemas", () => {
		expect(Object.keys(publicOpenApiSpec.components.schemas).sort()).toEqual([
			"Error",
			"PublicDeclaration",
			"PublicSearchResult",
		]);
	});

	describe("search endpoint", () => {
		const operation = publicOpenApiSpec.paths["/api/public/declarations"].get;

		it("declares the search operation", () => {
			expect(operation.operationId).toBe("searchPublicDeclarations");
		});

		it("declares every filter, pagination and their bounds", () => {
			expect(operation.parameters.map((p) => p.name).sort()).toEqual([
				"departement",
				"limit",
				"naf",
				"offset",
				"q",
				"region",
				"year",
			]);
			for (const param of operation.parameters) {
				expect(param.required).toBe(false);
			}
			const limit = operation.parameters.find((p) => p.name === "limit");
			const offset = operation.parameters.find((p) => p.name === "offset");
			expect(limit?.schema).toMatchObject({
				minimum: 1,
				maximum: 100,
				default: 10,
			});
			expect(offset?.schema).toMatchObject({ minimum: 0, default: 0 });
		});

		it("returns a PublicSearchResult on 200 and documents 400/500", () => {
			expect(
				operation.responses["200"].content["application/json"].schema.$ref,
			).toBe("#/components/schemas/PublicSearchResult");
			expect(operation.responses["400"]).toBeDefined();
			expect(operation.responses["500"]).toBeDefined();
			expect(
				operation.responses["200"].headers["Access-Control-Allow-Origin"],
			).toBeDefined();
		});
	});

	describe("by-siren endpoint", () => {
		const operation =
			publicOpenApiSpec.paths["/api/public/declarations/{siren}"].get;

		it("declares the by-siren operation returning an array", () => {
			expect(operation.operationId).toBe("getPublicDeclarationsBySiren");
			const schema = operation.responses["200"].content["application/json"]
				.schema as { type: string; items: { $ref: string } };
			expect(schema.type).toBe("array");
			expect(schema.items.$ref).toBe("#/components/schemas/PublicDeclaration");
		});

		it("requires the siren path parameter with a 9-digit pattern", () => {
			const siren = operation.parameters.find((p) => p.name === "siren");
			expect(siren?.in).toBe("path");
			expect(siren?.required).toBe(true);
			expect(siren?.schema).toMatchObject({ pattern: "^\\d{9}$" });
		});
	});

	describe("by-siren-and-year endpoint", () => {
		const operation =
			publicOpenApiSpec.paths["/api/public/declarations/{siren}/{year}"].get;

		it("declares the operation and both required path parameters", () => {
			expect(operation.operationId).toBe("getPublicDeclarationBySirenYear");
			const params = operation.parameters.filter((p) => p.in === "path");
			expect(params.map((p) => p.name)).toEqual(["siren", "year"]);
			for (const param of params) {
				expect(param.required).toBe(true);
			}
		});

		it("documents a 404 for a not-yet-public or missing declaration", () => {
			expect(operation.responses["404"]).toBeDefined();
			expect(operation.responses["404"].description).toMatch(
				/non trouvée|non encore publiée/i,
			);
		});
	});

	describe("export endpoint", () => {
		const operation =
			publicOpenApiSpec.paths["/api/public/declarations/export"].get;

		it("declares the export operation with a json/csv format enum", () => {
			expect(operation.operationId).toBe("exportPublicDeclarations");
			const format = operation.parameters.find((p) => p.name === "format");
			expect(format?.schema).toMatchObject({
				enum: ["json", "csv"],
				default: "json",
			});
		});

		it("documents both a json and a csv 200 response", () => {
			const content = operation.responses["200"].content;
			expect(content["application/json"]).toBeDefined();
			expect(content["text/csv"]).toBeDefined();
		});
	});

	describe("PublicDeclaration schema — data-model guarantees", () => {
		it("only requires year and siren", () => {
			expect(declarationSchema.required).toEqual(["year", "siren"]);
		});

		it("documents every field of the public declaration DTO", () => {
			const documentedFields = Object.keys(declarationSchema.properties).sort();
			const dtoFields = Object.keys(publicDeclarationDTOSchema.shape).sort();
			expect(documentedFields).toEqual(dtoFields);
		});

		it("exposes raw data only — no score, /100 index or note key (S6)", () => {
			const keys = Object.keys(declarationSchema.properties).join(" ");
			expect(keys).not.toMatch(/score|index|note/i);
		});

		it("excludes indicator G — no category-G key is documented", () => {
			const keys = Object.keys(declarationSchema.properties).join(" ");
			expect(keys).not.toMatch(/categoryg|indicatorg|categorieg|indicateurg/i);
		});

		it("marks the identity fields nullable for non-diffusible companies", () => {
			const properties = declarationSchema.properties as Record<
				string,
				{ type: string | readonly string[] }
			>;
			for (const field of [
				"name",
				"address",
				"region",
				"departmentCode",
				"departmentLabel",
				"nafCode",
				"nafLabel",
			]) {
				expect(properties[field]?.type).toContain("null");
			}
			expect(declarationSchema.properties.siren.type).toBe("string");
		});
	});

	describe("cross-cutting documentation", () => {
		it("documents the raw-data model, the G exclusion and the diffusion masking in the top-level description", () => {
			const description = publicOpenApiSpec.info.description;
			expect(description).toMatch(/données brutes/i);
			expect(description).toMatch(/indicateur G/i);
			expect(description).toMatch(/statutDiffusion/);
		});

		it("documents the public-release date gate in the top-level description", () => {
			expect(publicOpenApiSpec.info.description).toMatch(/rendu public/i);
		});

		it("references the date gate in each endpoint description", () => {
			for (const path of [
				"/api/public/declarations",
				"/api/public/declarations/{siren}",
				"/api/public/declarations/{siren}/{year}",
				"/api/public/declarations/export",
			] as const) {
				expect(publicOpenApiSpec.paths[path].get.description).toMatch(
					/rendu public|publié/i,
				);
			}
		});
	});
});
