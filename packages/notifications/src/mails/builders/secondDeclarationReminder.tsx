import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getConnectionUrl, getMySpaceUrl } from "../shared/urls.js";
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

export const buildSecondDeclarationReminderMail: MailBuilder<
	"second_declaration_reminder"
> = async (payload) => {
	const { year } = payload;
	const subject = `[Rappel] Egapro - Déclarez à nouveau l'indicateur d'écart de rémunération par catégorie de salariés pour l'année ${year}`;
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText = `Vous devez procéder à votre seconde déclaration au plus tard le ${formattedDeadline}.`;
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Pour rappel, l'indicateur d'écart de rémunération par catégorie de
				salariés fait apparaître un ou plusieurs écarts de rémunération
				supérieurs ou égaux à 5 %, et vous avez fait le choix d'effectuer des
				actions correctives ainsi qu'une seconde déclaration. Vous devez, en
				conséquence, procéder à cette seconde déclaration au plus tard le{" "}
				{formattedDeadline}.
			</EmailParagraph>
			<EmailClosingParagraph />
			<EmailCtaWithLink
				href={getMySpaceUrl()}
				label="Mon espace"
				linkHref={getConnectionUrl()}
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
