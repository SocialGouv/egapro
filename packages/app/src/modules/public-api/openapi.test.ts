import { describe, expect, it } from "vitest";
import {
	DATA_GOUV_REMUNERATION_DATASET_URL,
	DATA_GOUV_REPRESENTATION_DATASET_URL,
} from "./constants";
import { publicOpenApiSpec } from "./openapi";
import { publicDeclarationDTOSchema } from "./schemas";

const declarationSchema =
	publicOpenApiSpec.components.schemas.PublicDeclaration;

describe("publicOpenApiSpec", () => {
	it("is a valid OpenAPI 3.1 document", () => {
		expect(publicOpenApiSpec.openapi).toBe("3.1.0");
		expect(publicOpenApiSpec.info.title).toBe("EGAPRO — API publique");
		expect(publicOpenApiSpec.info.version).toBe("2.0.0");
		expect(publicOpenApiSpec.info.license?.name).toBe("Etalab 2.0");
		expect(publicOpenApiSpec.paths).toBeDefined();
	});

	it("documents the declarations export as the only public endpoint", () => {
		expect(Object.keys(publicOpenApiSpec.paths)).toEqual([
			"/api/public/declarations/export",
		]);
	});

	it("declares nothing but the get operation under each path item", () => {
		// A path key nested inside another path item would still serve a 200 on
		// /openapi.json while silently dropping the endpoint from the document.
		for (const [path, item] of Object.entries(publicOpenApiSpec.paths)) {
			expect(Object.keys(item), `path item ${path}`).toEqual(["get"]);
		}
	});

	it("exposes the two reusable component schemas", () => {
		expect(Object.keys(publicOpenApiSpec.components.schemas).sort()).toEqual([
			"Error",
			"PublicDeclaration",
		]);
	});

	describe("export endpoint", () => {
		const operation =
			publicOpenApiSpec.paths["/api/public/declarations/export"].get;

		it("declares the export operation with a json/csv format enum", () => {
			expect(operation.operationId).toBe("exportPublicDeclarations");
			const format = operation.parameters.find((p) => p.name === "format");
			expect(format?.schema).toMatchObject({
				enum: ["json", "csv", "xlsx"],
				default: "json",
			});
		});

		it("documents both a json and a csv 200 response", () => {
			const content = operation.responses["200"].content;
			expect(content["application/json"]).toBeDefined();
			expect(content["text/csv"]).toBeDefined();
		});

		it("declares every filter as optional, without pagination or sort", () => {
			expect(operation.parameters.map((p) => p.name).sort()).toEqual([
				"city",
				"departement",
				"format",
				"naf",
				"q",
				"region",
				"workforceMax",
				"workforceMin",
				"workforceRanges",
				"year",
			]);
			for (const param of operation.parameters) {
				expect(param.required).toBe(false);
			}
		});

		it("declares the repeatable facets as exploded arrays", () => {
			for (const name of ["region", "departement", "naf", "workforceRanges"]) {
				const param = operation.parameters.find((p) => p.name === name) as
					| { explode?: boolean; schema?: { type?: string } }
					| undefined;
				expect(param?.schema?.type).toBe("array");
				expect(param?.explode).toBe(true);
			}
		});

		it("documents the 400, 413 and 500 responses", () => {
			expect(operation.responses["400"]).toBeDefined();
			expect(operation.responses["413"]).toBeDefined();
			expect(operation.responses["500"]).toBeDefined();
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

		it("references the date gate in the export description", () => {
			expect(
				publicOpenApiSpec.paths["/api/public/declarations/export"].get
					.description,
			).toMatch(/rendu public|publié/i);
		});

		it("points consumers to both data.gouv.fr datasets", () => {
			const description = publicOpenApiSpec.info.description;
			expect(description).toContain(`(${DATA_GOUV_REMUNERATION_DATASET_URL})`);
			expect(description).toContain(
				`(${DATA_GOUV_REPRESENTATION_DATASET_URL})`,
			);
		});
	});
});
