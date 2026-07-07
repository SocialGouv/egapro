import { renderEmail } from "../shared/render.js";
import { getMySpaceUrl } from "../shared/urls.js";
import {
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildNextCycleHandoverMail: MailBuilder<
	"next_cycle_handover"
> = async (payload) => {
	const subject =
		"Egapro - Clôture de votre déclaration et ouverture du prochain cycle";
	const previewText = `Votre déclaration ${payload.previousYear} est clôturée. La prochaine campagne ${payload.nextYear} ouvrira le 1ᵉʳ mars ${payload.nextYear}.`;
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre déclaration des indicateurs au titre de l'année{" "}
				{payload.previousYear} est désormais clôturée.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, votre entreprise est tenue de déclarer
				chaque année les indicateurs relatifs aux écarts de rémunération.
			</EmailParagraph>
			<EmailParagraph>
				La prochaine campagne, au titre de l'année {payload.nextYear}, sera
				préremplie avec les données connues de l'administration pour les six
				premiers indicateurs de rémunération, issues de la DSN.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro dès l'ouverture
				de la nouvelle campagne pour vérifier ces informations, les modifier si
				nécessaire, et compléter le 7ᵉ indicateur pour les entreprises
				concernées.
			</EmailParagraph>
			<EmailParagraph>
				La prochaine campagne ouvrira le 1ᵉʳ mars {payload.nextYear}.
			</EmailParagraph>
			<EmailCtaWithLink href={getMySpaceUrl()} label="Accéder à mon espace" />
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
