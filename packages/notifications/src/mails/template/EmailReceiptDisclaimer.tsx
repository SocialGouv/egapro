import { EmailParagraph } from "./EmailParagraph.js";

type EmailReceiptDisclaimerProps = {
	// The only word that varies between mails: "dépôt" (upload flows) vs
	// "déclaration" (declaration flows).
	receiptNoun: "dépôt" | "déclaration";
};

// Shared "accusé de réception" disclaimer — regulatory wording, single source
// of truth so the two mail families cannot drift apart.
export function EmailReceiptDisclaimer({
	receiptNoun,
}: EmailReceiptDisclaimerProps) {
	// Single string child (no adjacent JSX expressions) so the rendered text
	// node stays continuous — identical bytes to the previous inline version.
	return (
		<EmailParagraph>
			{`L'administration du travail accuse réception de cette transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre ${receiptNoun}.`}
		</EmailParagraph>
	);
}
