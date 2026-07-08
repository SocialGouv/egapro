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

export const buildJointEvaluationReminderMail: MailBuilder<
	"joint_evaluation_reminder"
> = async (payload) => {
	const { year, round } = payload;
	const subject = `[Rappel] Egapro - Déposer le rapport de l'évaluation conjointe des rémunérations pour l'année ${year}`;
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText = `Vous devez déposer le rapport de l'évaluation conjointe au plus tard le ${formattedDeadline}.`;
	const statement =
		round === "first" ? (
			<EmailParagraph>
				Pour rappel, l'indicateur d'écart de rémunération par catégorie de
				salariés fait apparaître un ou plusieurs écarts de rémunération
				supérieurs ou égaux à 5 % et vous avez fait le choix de mettre en place
				une évaluation conjointe des rémunérations. Vous devez, en conséquence,
				déposer le rapport de cette évaluation au plus tard le{" "}
				{formattedDeadline}.
			</EmailParagraph>
		) : (
			<EmailParagraph>
				Pour rappel, l'indicateur d'écart de rémunération par catégorie de
				salariés fait de nouveau apparaître un ou plusieurs écarts de
				rémunération supérieurs ou égaux à 5 % dans votre seconde déclaration.
				Vous avez fait le choix de mettre en place une évaluation conjointe des
				rémunérations. Vous devez, en conséquence, procéder au dépôt du rapport
				au plus tard le {formattedDeadline}.
			</EmailParagraph>
		);
	const label = round === "first" ? "Déposer le rapport" : "Mon espace";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			{statement}
			<EmailClosingParagraph />
			<EmailCtaWithLink
				href={getMySpaceUrl()}
				label={label}
				linkHref={getConnectionUrl()}
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
