import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	DECLARATION_FSM_STATUSES,
} from "~/modules/domain";
import {
	representationNotComputableExecutivesEnum,
	representationNotComputableMembersEnum,
} from "~/server/db/schema";
import { openApiSpec } from "../openapi";
import { PARCOURS_KEYS, RELOCATED_ROOT_KEYS } from "./helpers/parcoursKeys";

describe("openApiSpec", () => {
	it("should be a valid OpenAPI 3.1 structure", () => {
		expect(openApiSpec.openapi).toBe("3.1.0");
		expect(openApiSpec.info.title).toBeDefined();
		expect(openApiSpec.info.version).toBe("3.0.0");
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

	describe("representations endpoint", () => {
		const path = openApiSpec.paths["/api/v1/export/representations"];

		it("should define the representations endpoint", () => {
			expect(path).toBeDefined();
			expect(path.get).toBeDefined();
			expect(path.get.operationId).toBe("getRepresentations");
		});

		it("should require date_begin and make date_end optional", () => {
			const params = path.get.parameters;
			expect(params.find((p) => p.name === "date_begin")?.required).toBe(true);
			expect(params.find((p) => p.name === "date_end")?.required).toBe(false);
		});

		it("should define the same response codes as the declarations endpoint", () => {
			expect(Object.keys(path.get.responses).sort()).toEqual(
				Object.keys(
					openApiSpec.paths["/api/v1/export/declarations"].get.responses,
				).sort(),
			);
		});

		it("should document the envelope with a Representations array", () => {
			const schema =
				path.get.responses["200"].content["application/json"].schema;
			expect(Object.keys(schema.properties)).toEqual([
				"Date_debut",
				"Date_fin",
				"Nombre",
				"Representations",
			]);
			expect(schema.properties.Representations.type).toBe("array");
		});

		it("should document every field the handler emits", () => {
			const representationSchema =
				path.get.responses["200"].content["application/json"].schema.properties
					.Representations.items;
			expect(Object.keys(representationSchema.properties)).toEqual([
				"id",
				"SIREN",
				"Raison_sociale",
				"Adresse",
				"Code_NAF",
				"Région",
				"Département",
				"Année_référence",
				"Période_référence_début",
				"Période_référence_fin",
				"Pourcentage_femmes_cadres",
				"Pourcentage_hommes_cadres",
				"Motif_non_calculabilité_cadres",
				"Pourcentage_femmes_membres",
				"Pourcentage_hommes_membres",
				"Motif_non_calculabilité_membres",
				"Date_publication",
				"URL_publication",
				"Modalités_communication",
				"Date_déclaration",
			]);
		});

		it("should mirror the DB enums on the non-computable reasons", () => {
			const properties =
				path.get.responses["200"].content["application/json"].schema.properties
					.Representations.items.properties;
			const executivesEnum =
				properties.Motif_non_calculabilité_cadres.oneOf.find(
					(v) => v.type === "string",
				);
			const membersEnum = properties.Motif_non_calculabilité_membres.oneOf.find(
				(v) => v.type === "string",
			);
			expect(
				executivesEnum && "enum" in executivesEnum && executivesEnum.enum,
			).toEqual([...representationNotComputableExecutivesEnum.enumValues]);
			expect(membersEnum && "enum" in membersEnum && membersEnum.enum).toEqual([
				...representationNotComputableMembersEnum.enumValues,
			]);
		});
	});

	describe("Parcours object (#4326)", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const parcoursSchema = declarationSchema.properties.Parcours;

		it("declares Parcours as an object carrying the path-derived properties", () => {
			expect(parcoursSchema.type).toBe("object");
			expect(Object.keys(parcoursSchema.properties)).toEqual([
				...PARCOURS_KEYS,
			]);
		});

		it("documents every Parcours property with a French description", () => {
			for (const key of PARCOURS_KEYS) {
				expect(parcoursSchema.properties[key].description).toBeTruthy();
			}
		});

		it("no longer documents the relocated keys at the schema root", () => {
			for (const key of RELOCATED_ROOT_KEYS) {
				expect(declarationSchema.properties).not.toHaveProperty(key);
			}
		});

		it("declares Tranche_effectif as a nullable enum of the size buckets", () => {
			const tranche = parcoursSchema.properties.Tranche_effectif;
			const stringVariant = tranche.oneOf.find((v) => v.type === "string");

			expect(tranche.oneOf.find((v) => v.type === "null")).toBeDefined();
			expect(
				stringVariant && "enum" in stringVariant && stringVariant.enum,
			).toEqual(Object.keys(COMPANY_SIZE_RANGES));
		});

		it("declares Regime_obligations as the company size classification enum", () => {
			const regime = parcoursSchema.properties.Regime_obligations;

			expect(regime.type).toBe("string");
			expect(regime.enum).toEqual([
				"voluntary",
				"mandatory",
				"mandatory_with_compliance",
			]);
		});

		it("declares Annulee as a boolean", () => {
			expect(parcoursSchema.properties.Annulee.type).toBe("boolean");
		});
	});

	describe("Prochaines_etapes_possibles schema (#4328)", () => {
		const stepsSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items
				.properties.Parcours.properties.Prochaines_etapes_possibles;

		it("declares an array of objects", () => {
			expect(stepsSchema.type).toBe("array");
			expect(stepsSchema.items.type).toBe("object");
		});

		it("lists exactly the five keys a step carries", () => {
			expect(Object.keys(stepsSchema.items.properties)).toEqual([
				"Identifiant_transition",
				"Action",
				"Etat_cible",
				"Libelle",
				"Condition",
			]);
		});

		it("requires everything but Condition, which stays optional", () => {
			expect(stepsSchema.items.required).toEqual([
				"Identifiant_transition",
				"Action",
				"Etat_cible",
				"Libelle",
			]);
			expect(stepsSchema.items.required).not.toContain("Condition");
		});

		it("mirrors Etat_cible on DECLARATION_FSM_STATUSES", () => {
			const etatCible = stepsSchema.items.properties.Etat_cible;

			expect(etatCible.type).toBe("string");
			expect(etatCible.enum).toEqual([...DECLARATION_FSM_STATUSES]);
		});

		it("declares Libelle as a nullable string", () => {
			expect(stepsSchema.items.properties.Libelle.type).toEqual([
				"string",
				"null",
			]);
		});

		it("documents the array and every step key with a French description", () => {
			expect(stepsSchema.description).toBeTruthy();
			for (const property of Object.values(stepsSchema.items.properties)) {
				expect(property.description).toBeTruthy();
			}
		});
	});

	describe("Statut field (declaration FSM status)", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const statutSchema =
			declarationSchema.properties.Parcours.properties.Statut;

		it("declares Statut as a string enum", () => {
			expect(statutSchema.type).toBe("string");
			expect(Array.isArray(statutSchema.enum)).toBe(true);
		});

		it("mirrors the enum exactly on DECLARATION_FSM_STATUSES", () => {
			expect([...statutSchema.enum].sort()).toEqual(
				[...DECLARATION_FSM_STATUSES].sort(),
			);
			expect(statutSchema.enum).toHaveLength(DECLARATION_FSM_STATUSES.length);
		});

		it("uses a valid FSM status as its example", () => {
			expect(DECLARATION_FSM_STATUSES).toContain(statutSchema.example);
		});
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
