import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	DECLARATION_FSM_STATUSES,
} from "~/modules/domain";
import {
	declarationEventTypeEnum,
	representationNotComputableExecutivesEnum,
	representationNotComputableMembersEnum,
} from "~/server/db/schema";
import type { IndicatorGEntry } from "../fetchDeclarations";
import { buildIndicatorG } from "../fetchDeclarations";
import { openApiSpec } from "../openapi";
import {
	DROPPED_ROOT_KEYS,
	PARCOURS_KEYS,
	RELOCATED_ROOT_KEYS,
} from "./helpers/parcoursKeys";

describe("openApiSpec", () => {
	it("should be a valid OpenAPI 3.1 structure", () => {
		expect(openApiSpec.openapi).toBe("3.1.0");
		expect(openApiSpec.info.title).toBeDefined();
		expect(openApiSpec.info.version).toBe("3.1.0");
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

	describe("Fichiers_CSE[].Contenus schema (#4535)", () => {
		const responseSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema;
		const declarationSchema = responseSchema.properties.Declarations.items;
		const fichiersCse = declarationSchema.properties.Fichiers_CSE;

		it("declares Contenus as an array on each Fichiers_CSE item", () => {
			const contenus = fichiersCse.items.properties.Contenus;
			expect(contenus).toBeDefined();
			expect(contenus.type).toBe("array");
		});

		it("mirrors Avis_CSE's vocabulary: Numero_declaration in {1, 2}, Type in {accuracy, gap}", () => {
			const item = fichiersCse.items.properties.Contenus.items;
			expect(item.properties.Numero_declaration.enum).toEqual([1, 2]);
			expect(item.properties.Type.enum).toEqual(["accuracy", "gap"]);
		});

		it("does not add Contenus to Fichier_evaluation_conjointe (unchanged)", () => {
			const jointEval =
				declarationSchema.properties.Fichier_evaluation_conjointe;
			const variants = jointEval.oneOf as ReadonlyArray<{
				type?: string;
				properties?: Record<string, unknown>;
			}>;
			const objectVariant = variants.find((v) => v.type === "object");
			expect(objectVariant).toBeDefined();
			expect(objectVariant?.properties?.Contenus).toBeUndefined();
		});
	});

	describe("/files contents schema (#4535)", () => {
		const filesSchema =
			openApiSpec.paths["/api/v1/files"].get.responses["200"].content[
				"application/json"
			].schema;
		const fileItemSchema = filesSchema.properties.files.items;

		it("declares contents as an array on the shared file item schema", () => {
			const contents = fileItemSchema.properties.contents;
			expect(contents).toBeDefined();
			expect(contents.type).toBe("array");
		});

		it("mirrors the declarations export vocabulary in English keys", () => {
			const item = fileItemSchema.properties.contents.items;
			expect(item.properties.declarationNumber.enum).toEqual([1, 2]);
			expect(item.properties.type.enum).toEqual(["accuracy", "gap"]);
		});
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

		it("documents the dropped keys nowhere, root nor Parcours", () => {
			for (const key of DROPPED_ROOT_KEYS) {
				expect(declarationSchema.properties).not.toHaveProperty(key);
				expect(parcoursSchema.properties).not.toHaveProperty(key);
			}
		});

		it("declares Tranche_effectif as a non-nullable enum of the size buckets", () => {
			const tranche = parcoursSchema.properties.Tranche_effectif;

			expect(tranche.type).toBe("string");
			expect(tranche.enum).toEqual(Object.keys(COMPANY_SIZE_RANGES));
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

	describe("Prochaines_etapes_possibles schema", () => {
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

		// Spelled out rather than read from `sources.ts`: comparing the spec to the
		// constant the spec imports would pass on any drift (#4115).
		it("lists the 4 active and 3 historical job-category source values", () => {
			const stringVariant = sourceSchema.oneOf.find((v) => v.type === "string");
			expect(stringVariant && hasEnum(stringVariant)).toBe(true);
			expect(
				stringVariant && hasEnum(stringVariant) && stringVariant.enum,
			).toEqual([
				"accord-entreprise",
				"accord-groupe",
				"accord-branche",
				"decision-unilaterale",
				"convention-collective",
				"classification-interne",
				"autre",
			]);
		});

		it("points at the generated value tables rather than listing values in prose", () => {
			expect(sourceSchema.description).toContain("docs/SUIT-API-valeurs.md");
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

		// Compared to the DB enum, not to the label map the spec reads: a test that
		// derives from the same constant as the spec detects nothing (#4115).
		it("lists every declaration_event_type value but step_change in Statut.enum", () => {
			expect(historiqueSchema.items.properties.Statut.type).toBe("string");
			expect(historiqueSchema.items.properties.Statut.enum).toEqual(
				declarationEventTypeEnum.enumValues.filter(
					(value) => value !== "step_change",
				),
			);
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

	describe("indicator F declared headcounts (#4528)", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const fSchema = declarationSchema.properties.Indicateurs.properties.F;

		const annualProperties = fSchema.properties.annuel.properties as Record<
			string,
			unknown
		>;
		const hourlyProperties = fSchema.properties.horaire.properties as Record<
			string,
			unknown
		>;

		it("documents the 8 annual nb_F/nb_H properties as nullable integers", () => {
			for (const quartile of [1, 2, 3, 4]) {
				for (const sex of ["F", "H"]) {
					const key = `Quartile${quartile}_Rem_globale_annuelle_nb_${sex}`;
					expect(annualProperties[key]).toEqual({ type: ["integer", "null"] });
				}
			}
		});

		it("documents the 8 hourly nb_F/nb_H properties as nullable integers", () => {
			for (const quartile of [1, 2, 3, 4]) {
				for (const sex of ["F", "H"]) {
					const key = `Quartile${quartile}_Taux_horaire_global_nb_${sex}`;
					expect(hourlyProperties[key]).toEqual({ type: ["integer", "null"] });
				}
			}
		});

		it("documents the two root-level hourly headcounts emitted by the handler", () => {
			expect(
				declarationSchema.properties.Effectif_F_rem_horaire_globale,
			).toEqual({
				type: ["integer", "null"],
				description: expect.any(String),
			});
			expect(
				declarationSchema.properties.Effectif_H_rem_horaire_globale,
			).toEqual({
				type: ["integer", "null"],
				description: expect.any(String),
			});
		});
	});

	describe("Parcours_apres_declaration enums (#4115)", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const stringEnumOf = (schema: {
			oneOf: readonly { type: string }[];
		}): readonly string[] | undefined => {
			const variant = schema.oneOf.find((v) => v.type === "string");
			return variant && "enum" in variant
				? (variant.enum as readonly string[])
				: undefined;
		};

		it("declares both fields as nullable string enums", () => {
			for (const field of [
				"Parcours_apres_declaration_1",
				"Parcours_apres_declaration_2",
			] as const) {
				const schema = declarationSchema.properties[field];
				expect(schema.oneOf).toHaveLength(2);
				expect(schema.oneOf.find((v) => v.type === "null")).toBeDefined();
				expect(stringEnumOf(schema)).toBeDefined();
			}
		});

		// The three round-1 paths and the two round-2 ones are spelled out here
		// rather than derived: the ruleset is what the spec reads (#4115).
		it("offers the three compliance paths after the first declaration", () => {
			expect(
				stringEnumOf(declarationSchema.properties.Parcours_apres_declaration_1),
			).toEqual(["justify", "corrective_action", "joint_evaluation"]);
		});

		it("never mentions corrective_action after the second declaration", () => {
			const schema = declarationSchema.properties.Parcours_apres_declaration_2;
			expect(stringEnumOf(schema)).toEqual(["justify", "joint_evaluation"]);
			expect(schema.description).not.toContain("corrective_action");
		});

		it("points at the generated value tables rather than listing values in prose", () => {
			for (const field of [
				"Parcours_apres_declaration_1",
				"Parcours_apres_declaration_2",
			] as const) {
				expect(declarationSchema.properties[field].description).toContain(
					"docs/SUIT-API-valeurs.md",
				);
			}
		});
	});

	describe("file and CSE opinion enums (#4115)", () => {
		const responseSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema;
		const declarationSchema = responseSchema.properties.Declarations.items;

		it("lists the two CSE consultation subjects on Avis_CSE[].Type", () => {
			expect(
				declarationSchema.properties.Avis_CSE.items.properties.Type.enum,
			).toEqual(["accuracy", "gap"]);
		});

		it("declares Avis_CSE[].Avis as a nullable enum of the two opinion senses", () => {
			const avis = declarationSchema.properties.Avis_CSE.items.properties.Avis;
			const stringVariant = avis.oneOf.find((v) => v.type === "string");
			expect(avis.oneOf.find((v) => v.type === "null")).toBeDefined();
			expect(
				stringVariant && "enum" in stringVariant && stringVariant.enum,
			).toEqual(["favorable", "unfavorable"]);
		});

		it("narrows each declaration file block to the single type it carries", () => {
			expect(
				declarationSchema.properties.Fichiers_CSE.items.properties.Type.enum,
			).toEqual(["cse_opinion"]);
			const jointEvaluation =
				declarationSchema.properties.Fichier_evaluation_conjointe.oneOf.find(
					(v) => v.type === "object",
				);
			expect(
				jointEvaluation &&
					"properties" in jointEvaluation &&
					jointEvaluation.properties.Type.enum,
			).toEqual(["joint_evaluation"]);
		});

		it("lists both file types on the files endpoint", () => {
			const filesSchema =
				openApiSpec.paths["/api/v1/files"].get.responses["200"].content[
					"application/json"
				].schema;
			expect(filesSchema.properties.files.items.properties.type.enum).toEqual([
				"cse_opinion",
				"joint_evaluation",
			]);
		});
	});

	describe("breaking-change notice on the declarations endpoint (#4329)", () => {
		const { description } =
			openApiSpec.paths["/api/v1/export/declarations"].get;
		const [major] = openApiSpec.info.version.split(".");

		it("announces the breaking change of the declared major version", () => {
			expect(description).toContain("rupture de compatibilité");
			expect(description).toContain(`majeure ${major}`);
		});

		it("names the Parcours object that carries the relocated keys", () => {
			expect(description).toContain("Parcours");
		});

		it("keeps every documented path on the v1 prefix the notice promises", () => {
			for (const path of Object.keys(openApiSpec.paths)) {
				expect(path).toMatch(/^\/api\/v1\//);
			}
		});
	});

	describe("Indicateurs.G category schema (#4530)", () => {
		const declarationSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items;
		const categorySchema =
			declarationSchema.properties.Indicateurs.properties.G.oneOf[0].items;

		const fullEntry: IndicatorGEntry = {
			categoryName: "Ouvriers",
			source: null,
			declarationType: "initial",
			womenCount: 40,
			menCount: 44,
			hourlyWomenCount: 8,
			hourlyMenCount: 6,
			annualBaseWomen: "10000",
			annualBaseMen: "11000",
			annualVariableWomen: "1000",
			annualVariableMen: "1010",
			hourlyBaseWomen: "20",
			hourlyBaseMen: "22",
			hourlyVariableWomen: "2",
			hourlyVariableMen: "2.5",
		};

		it("documents exactly the fields buildIndicatorG emits per category, in order", () => {
			const [category] = buildIndicatorG([fullEntry]).initial;
			expect(Object.keys(categorySchema.properties)).toEqual(
				Object.keys(category ?? {}),
			);
		});

		it("also used by Seconde_declaration.Correction (shared schema object)", () => {
			const correctionSchema =
				declarationSchema.properties.Seconde_declaration.properties.Correction
					.oneOf[0].items;
			expect(correctionSchema).toBe(categorySchema);
		});

		const ECART_KEYS = [
			"Rem_annuelle_base_ecart",
			"Rem_annuelle_variable_ecart",
			"Taux_horaire_base_ecart",
			"Taux_horaire_variable_ecart",
		] as const;

		it("types the four *_ecart fields as nullable strings, not numbers (#4530 bug)", () => {
			for (const key of ECART_KEYS) {
				expect(categorySchema.properties[key].type).toEqual(["string", "null"]);
				expect(categorySchema.properties[key].description).toBeTruthy();
			}
		});

		const HOURLY_HEADCOUNT_KEYS = [
			"Effectif_horaire_F",
			"Effectif_horaire_H",
		] as const;

		it("adds Effectif_horaire_F / Effectif_horaire_H as nullable integers", () => {
			for (const key of HOURLY_HEADCOUNT_KEYS) {
				expect(categorySchema.properties[key].type).toEqual([
					"integer",
					"null",
				]);
				expect(categorySchema.properties[key].description).toBeTruthy();
			}
		});
	});

	describe("Indicateurs A–D gap fields schema (#4530)", () => {
		const indicatorsSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items
				.properties.Indicateurs;

		it("documents A.Rem_globale_annuelle_moyenne_ecart and A.Taux_horaire_global_moyen_ecart as nullable strings", () => {
			const {
				Rem_globale_annuelle_moyenne_ecart,
				Taux_horaire_global_moyen_ecart,
			} = indicatorsSchema.properties.A.properties;
			expect(Rem_globale_annuelle_moyenne_ecart.type).toEqual([
				"string",
				"null",
			]);
			expect(Rem_globale_annuelle_moyenne_ecart.description).toBeTruthy();
			expect(Taux_horaire_global_moyen_ecart.type).toEqual(["string", "null"]);
			expect(Taux_horaire_global_moyen_ecart.description).toBeTruthy();
		});

		it("documents B.Rem_variable_annuelle_moyenne_ecart and B.Taux_horaire_variable_moyen_ecart as nullable strings", () => {
			const {
				Rem_variable_annuelle_moyenne_ecart,
				Taux_horaire_variable_moyen_ecart,
			} = indicatorsSchema.properties.B.properties;
			expect(Rem_variable_annuelle_moyenne_ecart.type).toEqual([
				"string",
				"null",
			]);
			expect(Rem_variable_annuelle_moyenne_ecart.description).toBeTruthy();
			expect(Taux_horaire_variable_moyen_ecart.type).toEqual([
				"string",
				"null",
			]);
			expect(Taux_horaire_variable_moyen_ecart.description).toBeTruthy();
		});

		it("documents C.Rem_globale_annuelle_médiane_ecart and C.Taux_horaire_global_médian_ecart as nullable strings", () => {
			const {
				Rem_globale_annuelle_médiane_ecart,
				Taux_horaire_global_médian_ecart,
			} = indicatorsSchema.properties.C.properties;
			expect(Rem_globale_annuelle_médiane_ecart.type).toEqual([
				"string",
				"null",
			]);
			expect(Rem_globale_annuelle_médiane_ecart.description).toBeTruthy();
			expect(Taux_horaire_global_médian_ecart.type).toEqual(["string", "null"]);
			expect(Taux_horaire_global_médian_ecart.description).toBeTruthy();
		});

		it("documents D.Rem_variable_annuelle_médiane_ecart and D.Taux_horaire_variable_médian_ecart as nullable strings", () => {
			const {
				Rem_variable_annuelle_médiane_ecart,
				Taux_horaire_variable_médian_ecart,
			} = indicatorsSchema.properties.D.properties;
			expect(Rem_variable_annuelle_médiane_ecart.type).toEqual([
				"string",
				"null",
			]);
			expect(Rem_variable_annuelle_médiane_ecart.description).toBeTruthy();
			expect(Taux_horaire_variable_médian_ecart.type).toEqual([
				"string",
				"null",
			]);
			expect(Taux_horaire_variable_médian_ecart.description).toBeTruthy();
		});
	});

	describe("Indicateur F proportions schema (#4530)", () => {
		const fSchema =
			openApiSpec.paths["/api/v1/export/declarations"].get.responses["200"]
				.content["application/json"].schema.properties.Declarations.items
				.properties.Indicateurs.properties.F;

		it("types every quartile proportion as a nullable string (was number)", () => {
			for (const quartileSchema of [
				fSchema.properties.annuel,
				fSchema.properties.horaire,
			]) {
				for (const [key, property] of Object.entries(
					quartileSchema.properties,
				)) {
					if (!key.includes("proportion")) continue;
					expect(property.type).toEqual(["string", "null"]);
				}
			}
		});
	});
});
