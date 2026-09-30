import { EmailParagraph } from "./EmailParagraph.js";

type EmailReceiptDisclaimerProps = {
	// The only word that varies between mails: "dépôt" (upload flows) vs
	// "déclaration" (declaration flows).
	receiptNoun: "dépôt" | "déclaration";
	withConformityDisclaimer?: boolean;
};

// Shared "accusé de réception" disclaimer — regulatory wording, single source
// of truth so the two mail families cannot drift apart.
export function EmailReceiptDisclaimer({
	receiptNoun,
	withConformityDisclaimer = true,
}: EmailReceiptDisclaimerProps) {
	const acknowledgement =
		"L'administration du travail accuse réception de cette transmission.";
	// Single string child (no adjacent JSX expressions) so the rendered text
	// node stays continuous — identical bytes to the previous inline version.
	return (
		<EmailParagraph>
			{withConformityDisclaimer
				? `${acknowledgement} Cet accusé de réception ne vaut pas contrôle de conformité de votre ${receiptNoun}.`
				: acknowledgement}
		</EmailParagraph>
	);
}
