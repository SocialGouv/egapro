import { formatPhone, toCanonicalPhone } from "./phone";
import type { ProfileUpdate } from "./schemas";

export type SavedProfile = {
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
};

type ProfileField = keyof ProfileUpdate;

export type ProfileChange = {
	field: ProfileField;
	label: string;
	previous: string;
	next: string;
};

export const EMPTY_PROFILE_VALUE = "Non renseigné";

type FieldDescriptor = {
	field: ProfileField;
	label: string;
	normalize: (value: string) => string;
	display: (value: string) => string;
};

const keepName = (value: string) => value.trim();
const canonicalPhone = (value: string) => toCanonicalPhone(value) ?? value;

const PROFILE_FIELDS: FieldDescriptor[] = [
	{ field: "lastName", label: "Nom", normalize: keepName, display: keepName },
	{
		field: "firstName",
		label: "Prénom",
		normalize: keepName,
		display: keepName,
	},
	{
		field: "phone",
		label: "Numéro de téléphone",
		normalize: canonicalPhone,
		display: (value) => formatPhone(canonicalPhone(value)),
	},
];

export function listProfileChanges(
	saved: SavedProfile | null | undefined,
	next: ProfileUpdate,
): ProfileChange[] {
	return PROFILE_FIELDS.flatMap(({ field, label, normalize, display }) => {
		const previous = saved?.[field] ?? "";
		if (normalize(previous) === normalize(next[field])) return [];
		return [
			{
				field,
				label,
				previous: previous ? display(previous) : EMPTY_PROFILE_VALUE,
				next: display(next[field]),
			},
		];
	});
}
