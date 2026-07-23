import { describe, expect, it } from "vitest";

import { openApiSpec } from "../openapi";

describe("openApiSpec", () => {
	it("should be a valid OpenAPI 3.1 structure", () => {
		expect(openApiSpec.openapi).toBe("3.1.0");
		expect(openApiSpec.info.title).toBeDefined();
		expect(openApiSpec.info.version).toBe("2.1.0");
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

	it("should declare id as first property of declarationSchema with uuid format", () => {
		const responseSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema;
		const declarationSchema = responseSchema.properties.Declarations.items;
		expect(declarationSchema.properties.id).toBeDefined();
		expect(declarationSchema.properties.id.type).toBe("string");
		expect(declarationSchema.properties.id.format).toBe("uuid");
		expect(Object.keys(declarationSchema.properties)[0]).toBe("id");
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

	describe("Source_categories_emplois schema (#3944)", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const sourceSchema = declarationSchema.properties.Source_categories_emplois;
		const hasEnum = (v: {
			type: string;
		}): v is { type: string; enum: readonly string[] } => "enum" in v;

		it("declares Source_categories_emplois as a nullable string enum", () => {
			expect(sourceSchema).toBeDefined();
			expect(sourceSchema.oneOf).toHaveLength(2);
			const stringVariant = sourceSchema.oneOf.find((v) => v.type === "string");
			const nullVariant = sourceSchema.oneOf.find((v) => v.type === "null");
			expect(stringVariant).toBeDefined();
			expect(nullVariant).toBeDefined();
		});

		it("lists the 4 job-category source values in the string enum", () => {
			const stringVariant = sourceSchema.oneOf.find((v) => v.type === "string");
			expect(stringVariant && hasEnum(stringVariant)).toBe(true);
			expect(
				stringVariant && hasEnum(stringVariant) && stringVariant.enum,
			).toEqual([
				"accord-entreprise",
				"accord-groupe",
				"accord-branche",
				"decision-unilaterale",
			]);
		});
	});

	describe("Historique_statuts schema", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const historiqueSchema = declarationSchema.properties.Historique_statuts;

		it("declares Historique_statuts as an array", () => {
			expect(historiqueSchema).toBeDefined();
			expect(historiqueSchema.type).toBe("array");
			expect(historiqueSchema.items).toBeDefined();
			expect(historiqueSchema.items.type).toBe("object");
		});

		it("requires Statut, Libelle_statut and Date on each item", () => {
			expect(historiqueSchema.items.required).toEqual([
				"Statut",
				"Libelle_statut",
				"Date",
			]);
		});

		it("lists the 7 declaration_event_type values in Statut.enum", () => {
			expect(historiqueSchema.items.properties.Statut.type).toBe("string");
			expect(historiqueSchema.items.properties.Statut.enum).toEqual([
				"submit",
				"path_choice",
				"second_declaration_submit",
				"joint_evaluation_submit",
				"cse_opinion_submit",
				"cancel",
				"demarche_complete",
			]);
		});

		it("declares Date as date-time formatted string", () => {
			expect(historiqueSchema.items.properties.Date.type).toBe("string");
			expect(historiqueSchema.items.properties.Date.format).toBe("date-time");
		});

		it("declares Numero_declaration as optional integer enum [1, 2]", () => {
			const numero = historiqueSchema.items.properties.Numero_declaration;
			expect(numero.type).toBe("integer");
			expect(numero.enum).toEqual([1, 2]);
			expect(historiqueSchema.items.required).not.toContain(
				"Numero_declaration",
			);
		});
	});
});
