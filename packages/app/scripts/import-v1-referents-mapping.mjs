import { z } from "zod";

import { COUNTY_CODES, REGION_CODES } from "~/modules/domain";

/**
 * @typedef {Object} V1Referent
 * @property {string} id
 * @property {string | null} county
 * @property {string} name
 * @property {boolean} principal
 * @property {string} region
 * @property {string} type
 * @property {string} value
 * @property {string | null} substitute_name
 * @property {string | null} substitute_email
 */

/**
 * @typedef {Object} MappedReferent
 * @property {string} id
 * @property {string | null} county
 * @property {string} name
 * @property {boolean} principal
 * @property {string} region
 * @property {"email" | "url"} type
 * @property {string} value
 * @property {string | null} substituteName
 * @property {string | null} substituteEmail
 */

const baseReferentFields = {
	id: z.string().uuid(),
	county: z.enum(COUNTY_CODES).nullable(),
	name: z.string().min(1).max(255),
	principal: z.boolean(),
	region: z.enum(REGION_CODES),
	substitute_name: z.string().max(255).nullable(),
	substitute_email: z.string().email().max(255).nullable(),
};

const v1ReferentSchema = z.discriminatedUnion("type", [
	z.object({
		...baseReferentFields,
		type: z.literal("email"),
		value: z.string().email().max(500),
	}),
	z.object({
		...baseReferentFields,
		type: z.literal("url"),
		value: z.string().url().max(500),
	}),
]);

/**
 * @param {z.ZodError} error
 * @returns {string}
 */
function formatValidationIssues(error) {
	return error.issues
		.map((issue) => `${issue.path.join(".") || "row"}:${issue.code}`)
		.join(", ");
}

/**
 * @param {unknown} row
 * @returns {MappedReferent}
 */
export function mapReferentFromV1(row) {
	const result = v1ReferentSchema.safeParse(row);
	if (!result.success) {
		throw new Error(
			`Invalid legacy referent row (${formatValidationIssues(result.error)})`,
		);
	}

	return {
		id: result.data.id,
		county: result.data.county,
		name: result.data.name,
		principal: result.data.principal,
		region: result.data.region,
		type: result.data.type,
		value: result.data.value,
		substituteName: result.data.substitute_name,
		substituteEmail: result.data.substitute_email,
	};
}

/**
 * A referent import is a complete directory replacement. Any invalid row must
 * abort the entire snapshot before the target database is touched.
 *
 * @param {unknown[]} rows
 * @returns {MappedReferent[]}
 */
export function mapReferentSnapshotFromV1(rows) {
	if (rows.length === 0) {
		throw new Error("Legacy referent snapshot is empty");
	}

	/** @type {MappedReferent[]} */
	const referents = [];
	/** @type {Map<string, number>} */
	const firstRowById = new Map();
	/** @type {string[]} */
	const errors = [];

	for (const [index, row] of rows.entries()) {
		try {
			const referent = mapReferentFromV1(row);
			const firstRow = firstRowById.get(referent.id);
			if (firstRow !== undefined) {
				errors.push(`row ${index + 1}:duplicate_id:first_seen_row_${firstRow}`);
				continue;
			}

			firstRowById.set(referent.id, index + 1);
			referents.push(referent);
		} catch (error) {
			errors.push(
				`row ${index + 1}:${error instanceof Error ? error.message : "invalid_row"}`,
			);
		}
	}

	if (errors.length > 0) {
		throw new Error(`Invalid legacy referent snapshot: ${errors.join("; ")}`);
	}

	return referents;
}
