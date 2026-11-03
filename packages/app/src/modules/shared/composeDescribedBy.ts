type DescriptionId = string | false | null | undefined;

export function composeDescribedBy(
	...ids: readonly DescriptionId[]
): string | undefined {
	const joined = ids.filter((id): id is string => Boolean(id)).join(" ");
	return joined === "" ? undefined : joined;
}
