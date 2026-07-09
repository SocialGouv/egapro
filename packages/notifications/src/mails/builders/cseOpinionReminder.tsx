import { renderEmail } from "../shared/render.js";
import { getAvisCseUrl, getLoginUrl } from "../shared/urls.js";
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

// Single unified content for every CSE-opinion reminder branch. The payload
// `variant` still drives the eligibility query and the send schedule (each
// compliance branch is reminded at its own fixed date), but the message shown
// to the user is the same for all of them, per the Figma sending plan.
export const buildCseOpinionReminderMail: MailBuilder<
	"cse_opinion_reminder"
> = async (payload) => {
	const { year } = payload;
	const subject = `[Rappel] Egapro - Déposer le ou les avis du CSE pour l'année ${year}`;
	const previewText =
		"Vous devez déposer le ou les avis du CSE portant sur l'exactitude des données et la justification éventuelle des écarts de rémunération.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Pour rappel, vous devez à présent déposer le ou les avis du CSE portant
				sur l'exactitude des données et des méthodes de calcul utilisées et
				éventuellement la justification des écarts de rémunération, pour
				l'indicateur de rémunération par catégorie de salariés.
			</EmailParagraph>
			<EmailClosingParagraph />
			<EmailCtaWithLink
				href={getAvisCseUrl()}
				label="Déposer le rapport"
				linkHref={getLoginUrl()}
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
