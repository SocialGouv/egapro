// Kept lowercase unless they open the string — INSEE/Weez text (address, country label…) comes fully uppercased.
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

export function formatInseeTitleCase(text: string): string {
	return text
		.toLocaleLowerCase("fr-FR")
		.replace(/\p{L}+/gu, (word, offset: number) => {
			if (offset > 0 && LOWERCASE_WORDS.has(word)) return word;
			return (word[0]?.toLocaleUpperCase("fr-FR") ?? "") + word.slice(1);
		});
}
