import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getDeclarationUrl } from "../shared/urls.js";
import {
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { CseOpinionReminderVariant, MailBuilder } from "../types.js";

type VariantCopy = {
	subjectSuffix: string;
	previewText: string;
	statementParagraph: string;
	frameworkParagraph: string;
	scopeParagraph: string;
	ctaLabel: string;
};

const VARIANT_COPY: Record<CseOpinionReminderVariant, VariantCopy> = {
	compliance: {
		subjectSuffix: "exactitude des données",
		previewText:
			"L'avis du CSE sur l'exactitude des données déclarées n'a pas encore été déposé.",
		statementParagraph:
			"L'avis de votre CSE sur l'exactitude des données déclarées n'a pas encore été déposé sur la plateforme Egapro.",
		frameworkParagraph:
			"Conformément à la réglementation, les entreprises d'au moins 100 salariés doivent recueillir l'avis de leur CSE sur l'exactitude des indicateurs publiés.",
		scopeParagraph:
			"Cet avis doit confirmer l'exactitude des données figurant dans votre déclaration.",
		ctaLabel: "Déposer l'avis du CSE",
	},
	justify_oct: {
		subjectSuffix:
			"exactitude des données et justification des écarts (1er octobre)",
		previewText:
			"L'avis du CSE sur l'exactitude des données et la justification des écarts est attendu avant le 1er octobre.",
		statementParagraph:
			"L'avis de votre CSE sur l'exactitude des données et la justification des écarts constatés n'a pas encore été déposé sur la plateforme Egapro.",
		frameworkParagraph:
			"Conformément à la réglementation, le CSE doit être consulté sur les justifications avancées pour les écarts de rémunération constatés.",
		scopeParagraph:
			"Le dépôt de cet avis doit intervenir avant le 1er octobre.",
		ctaLabel: "Déposer l'avis du CSE",
	},
	justify_dec: {
		subjectSuffix: "avis du CSE non encore déposé (relance du 1er décembre)",
		previewText:
			"L'avis du CSE sur votre justification des écarts n'a pas encore été reçu.",
		statementParagraph:
			"Nous n'avons pas encore reçu l'avis de votre CSE sur la justification des écarts de rémunération.",
		frameworkParagraph:
			"Conformément à la réglementation, votre justification des écarts doit être validée par l'avis du CSE pour clôturer votre procédure de mise en conformité.",
		scopeParagraph:
			"Sans dépôt de cet avis, la procédure de mise en conformité ne pourra pas être clôturée pour cette campagne.",
		ctaLabel: "Déposer l'avis du CSE",
	},
	corrective: {
		subjectSuffix:
			"actions correctives — exactitude des données des deux déclarations",
		previewText:
			"L'avis du CSE sur l'exactitude des données des deux déclarations n'a pas encore été déposé.",
		statementParagraph:
			"L'avis de votre CSE sur l'exactitude des données de votre première déclaration et de votre seconde déclaration au titre des actions correctives n'a pas encore été déposé.",
		frameworkParagraph:
			"Conformément à la réglementation, votre CSE doit être consulté sur l'exactitude des indicateurs publiés ainsi que sur les actions correctives mises en œuvre.",
		scopeParagraph:
			"L'avis doit également mentionner les justifications éventuelles des écarts persistants.",
		ctaLabel: "Déposer l'avis du CSE",
	},
	joint_eval: {
		subjectSuffix: "évaluation conjointe (relance du 1er décembre)",
		previewText:
			"L'avis du CSE sur le rapport d'évaluation conjointe n'a pas encore été déposé.",
		statementParagraph:
			"L'avis de votre CSE sur le rapport d'évaluation conjointe déposé pour votre entreprise n'a pas encore été reçu.",
		frameworkParagraph:
			"Conformément à la réglementation, le CSE doit statuer sur l'évaluation conjointe et confirmer l'exactitude des données associées.",
		scopeParagraph:
			"Sans dépôt de cet avis, votre démarche d'évaluation conjointe restera incomplète.",
		ctaLabel: "Déposer l'avis du CSE",
	},
};

export const buildCseOpinionReminderMail: MailBuilder<
	"cse_opinion_reminder"
> = async (payload) => {
	const copy = VARIANT_COPY[payload.variant];
	const subject = `Egapro - Rappel : avis du CSE — ${copy.subjectSuffix}`;
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const { html, text } = await renderEmail(
		<EmailShell previewText={copy.previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>{copy.statementParagraph}</EmailParagraph>
			<EmailParagraph>{copy.frameworkParagraph}</EmailParagraph>
			<EmailParagraph>{copy.scopeParagraph}</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro afin de déposer
				l'avis du CSE.
			</EmailParagraph>
			<EmailParagraph>
				Le dépôt doit intervenir au plus tard le {formattedDeadline}.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getDeclarationUrl(payload.siren, payload.year)}
				label={copy.ctaLabel}
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
