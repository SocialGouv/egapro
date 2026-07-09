import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getCompliancePathUrl, getLoginUrl } from "../shared/urls.js";
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

export const buildCompliancePathChoiceReminderMail: MailBuilder<
	"compliance_path_choice_reminder"
> = async (payload) => {
	const { year, round } = payload;
	const subject = `[Rappel] Egapro - Choisissez le parcours de mise en conformité pour l'indicateur d'écart de rémunération par catégorie de salariés pour l'année ${year}`;
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText = `Vous devez sélectionner un parcours de mise en conformité au plus tard le ${formattedDeadline}.`;
	const statement =
		round === "first" ? (
			<EmailParagraph>
				Pour rappel, l'indicateur d'écart de rémunération par catégorie de
				salariés fait apparaître un ou plusieurs écarts de rémunération
				supérieurs ou égaux à 5 %. Vous devez, en conséquence, sélectionner un
				parcours de mise en conformité au plus tard le {formattedDeadline}.
			</EmailParagraph>
		) : (
			<EmailParagraph>
				Pour rappel, l'indicateur d'écart de rémunération par catégorie de
				salariés fait de nouveau apparaître un ou plusieurs écarts de
				rémunération supérieurs ou égaux à 5 % dans votre seconde déclaration.
				Vous devez, en conséquence, sélectionner un parcours de mise en
				conformité au plus tard le {formattedDeadline}.
			</EmailParagraph>
		);
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			{statement}
			<EmailClosingParagraph />
			<EmailCtaWithLink
				href={getCompliancePathUrl()}
				label="Sélectionner le parcours"
				linkHref={getLoginUrl()}
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
