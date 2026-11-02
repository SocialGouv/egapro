import { describe, expect, it } from "vitest";

import {
	EMPTY_PROFILE_VALUE,
	listProfileChanges,
	type SavedProfile,
} from "../profileChanges";

const SAVED: SavedProfile = {
	firstName: "Julien",
	lastName: "Martin",
	phone: "+33122334455",
};

const UNCHANGED = {
	firstName: "Julien",
	lastName: "Martin",
	phone: "+33122334455",
};

describe("listProfileChanges", () => {
	it("returns no change when the submitted values match the stored ones", () => {
		expect(listProfileChanges(SAVED, UNCHANGED)).toEqual([]);
	});

	it("lists only the changed fields, in form order, with display values", () => {
		expect(
			listProfileChanges(SAVED, {
				firstName: "Camille",
				lastName: "Durand",
				phone: "+33122334456",
			}),
		).toEqual([
			{ field: "lastName", label: "Nom", previous: "Martin", next: "Durand" },
			{
				field: "firstName",
				label: "Prénom",
				previous: "Julien",
				next: "Camille",
			},
			{
				field: "phone",
				label: "Numéro de téléphone",
				previous: "+33 1 22 33 44 55",
				next: "+33 1 22 33 44 56",
			},
		]);
	});

	it("treats a legacy local phone equal to the canonical one as unchanged", () => {
		expect(
			listProfileChanges({ ...SAVED, phone: "01 22 33 44 55" }, UNCHANGED),
		).toEqual([]);
	});

	it("ignores surrounding whitespace on stored names", () => {
		expect(
			listProfileChanges({ ...SAVED, lastName: " Martin " }, UNCHANGED),
		).toEqual([]);
	});

	it("labels missing stored values as not provided", () => {
		expect(
			listProfileChanges(
				{ firstName: null, lastName: null, phone: null },
				UNCHANGED,
			).map((change) => change.previous),
		).toEqual([EMPTY_PROFILE_VALUE, EMPTY_PROFILE_VALUE, EMPTY_PROFILE_VALUE]);
	});

	it("treats every field as new when no stored profile is available", () => {
		expect(listProfileChanges(undefined, UNCHANGED)).toHaveLength(3);
		expect(listProfileChanges(null, UNCHANGED)).toHaveLength(3);
	});
});
