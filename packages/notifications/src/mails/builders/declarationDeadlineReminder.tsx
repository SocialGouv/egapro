import { renderEmail } from "../shared/render.js";
import { getDeclarationUrl, getLoginUrl } from "../shared/urls.js";
import {
	EmailClosingParagraph,
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildDeclarationDeadlineReminderMail: MailBuilder<
	"declaration_deadline_reminder"
> = async (payload) => {
	const { year } = payload;
	const subject = `[Rappel] Egapro - Déclarez vos indicateurs d'égalité professionnelle pour l'année ${year}`;
	const previewText = `Votre déclaration des indicateurs de rémunération n'a pas encore été transmise pour l'année ${year}.`;
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre déclaration des indicateurs de rémunération de l'égalité
				professionnelle n'a pas encore été transmise pour l'année {year}.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous rappelons que cette déclaration est obligatoire pour les
				entreprises concernées. Elle doit être effectuée depuis votre espace
				Egapro.
			</EmailParagraph>
			<EmailClosingParagraph />
			<EmailCtaWithLink
				href={getDeclarationUrl()}
				label="Compléter ma déclaration"
				linkHref={getLoginUrl()}
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
