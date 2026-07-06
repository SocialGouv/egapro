import { formatFrenchDate, formatSiren } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getDeclarationUrl, getMySpaceUrl } from "../shared/urls.js";
import {
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { DeclarationConfirmationVariant, MailBuilder } from "../types.js";

type VariantContent = {
	subject: string;
	previewText: string;
	variantParagraph: string;
	ctaLabel: string;
	ctaHref: string;
};

function getVariantContent(
	variant: DeclarationConfirmationVariant,
	siren: string,
	year: number,
	complianceDeadline: string | undefined,
): VariantContent {
	switch (variant) {
		case "completed":
			return {
				subject:
					"Egapro - Transmission de la seconde déclaration et fin de démarche",
				previewText:
					"Votre seconde déclaration des indicateurs de rémunération a bien été transmise.",
				variantParagraph:
					"Votre démarche est désormais terminée. Vous pouvez à tout moment consulter et télécharger vos déclarations depuis votre espace.",
				ctaLabel: "Mon espace",
				ctaHref: getMySpaceUrl(),
			};
		case "cse_to_deposit":
			return {
				subject: "Egapro - Transmission de la seconde déclaration",
				previewText:
					"Votre seconde déclaration des indicateurs de rémunération a bien été transmise.",
				variantParagraph:
					"Vous devez à présent déposer le ou les avis du CSE portant sur l'exactitude des données et des méthodes de calcul utilisées pour la première et la seconde déclaration.",
				ctaLabel: "Déposer l'avis",
				ctaHref: getDeclarationUrl(siren, year),
			};
		case "path_to_select": {
			if (!complianceDeadline) {
				throw new Error(
					"complianceDeadline is required for path_to_select variant",
				);
			}
			const formattedDeadline = formatFrenchDate(complianceDeadline);
			return {
				subject: "Egapro - Transmission de la seconde déclaration",
				previewText:
					"Votre seconde déclaration des indicateurs de rémunération a bien été transmise.",
				variantParagraph: `L'indicateur d'écart de rémunération par catégorie de salariés fait à nouveau apparaître un ou plusieurs écarts de rémunération supérieurs ou égaux à 5 %. En conséquence, vous devez sélectionner un parcours de mise en conformité au plus tard le ${formattedDeadline}.`,
				ctaLabel: "Sélectionner le parcours",
				ctaHref: getDeclarationUrl(siren, year),
			};
		}
	}
}

export const buildSecondDeclarationConfirmationMail: MailBuilder<
	"second_declaration_confirmation"
> = async (payload) => {
	const { siren, year, variant, raisonSociale, complianceDeadline } = payload;
	const content = getVariantContent(variant, siren, year, complianceDeadline);
	const formattedSiren = formatSiren(siren);
	const { html, text } = await renderEmail(
		<EmailShell previewText={content.previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Vous avez transmis aux services du ministre chargé du Travail{" "}
				<strong>
					l'indicateur d'écart de rémunération par catégorie de salariés entre
					les femmes et les hommes
				</strong>
				, issu de votre seconde déclaration pour {year}, concernant l'entreprise{" "}
				<strong>{raisonSociale}</strong> (SIREN : {formattedSiren}).
			</EmailParagraph>
			<EmailParagraph>
				L'administration du travail accuse réception de cette transmission. Cet
				accusé de réception ne vaut pas contrôle de conformité de votre
				déclaration.
			</EmailParagraph>
			<EmailParagraph>{content.variantParagraph}</EmailParagraph>
			<EmailCtaWithLink href={content.ctaHref} label={content.ctaLabel} />
			<EmailParagraph>
				Pour tout renseignement, vous pouvez contacter votre référent égalité
				professionnelle femmes-hommes au sein de votre DREETS en répondant à ce
				message.
			</EmailParagraph>
			<EmailSignature />
		</EmailShell>,
	);
	return { subject: content.subject, html, text };
};
