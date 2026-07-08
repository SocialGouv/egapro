import { EmailParagraph } from "./EmailParagraph.js";

// Shared call-to-action closing line — identical across every reminder mail.
// Centralised so the wording has a single source of truth.
export function EmailClosingParagraph() {
	return (
		<EmailParagraph>
			Nous vous invitons à effectuer cette démarche dans les meilleurs délais.
		</EmailParagraph>
	);
}
