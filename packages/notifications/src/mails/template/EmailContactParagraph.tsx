import { EmailParagraph } from "./EmailParagraph.js";

// Shared closing paragraph — identical across every mail builder. Centralised
// so the (regulatory) contact wording has a single source of truth.
export function EmailContactParagraph() {
	return (
		<EmailParagraph>
			Pour tout renseignement, vous pouvez contacter votre référent égalité
			professionnelle femmes-hommes au sein de votre DREETS en répondant à ce
			message.
		</EmailParagraph>
	);
}
