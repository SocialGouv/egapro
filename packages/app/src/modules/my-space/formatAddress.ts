// Addresses from INSEE/Weez come fully uppercased. Render them in title case
// while keeping digits and short connector words (de, du, la, le, les…) lowercase.
const LOWERCASE_WORDS = new Set([
	"de",
	"du",
	"des",
	"la",
	"le",
	"les",
	"et",
	"en",
	"aux",
	"sur",
	"sous",
	"d",
	"l",
]);

/**
 * Converts a fully-uppercased INSEE/Weez address to title case.
 * Short French connector words (de, du, la, le, …) are kept lowercase
 * unless they appear as the first word of the address.
 *
 * @param address - The raw uppercase address string.
 * @returns The address formatted in title case.
 */
export function formatAddress(address: string): string {
	return address
		.toLocaleLowerCase("fr-FR")
		.replace(/\p{L}+/gu, (word, offset: number) => {
			if (offset > 0 && LOWERCASE_WORDS.has(word)) return word;
			return word[0]!.toLocaleUpperCase("fr-FR") + word.slice(1);
		});
}
