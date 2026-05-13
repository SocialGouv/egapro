import { formatFrenchDate, getPublicUrl } from "./helpers.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./shell.js";
export const buildCampaignOpeningMail = (payload) => {
    const subject = `Ouverture de la campagne de déclaration ${payload.year}`;
    const body = `
${infoList([
        { label: "Année de déclaration", value: payload.year },
        { label: "Date limite", value: formatFrenchDate(payload.deadlineIso) },
    ])}
${paragraph("Connectez-vous à votre espace Egapro pour démarrer ou poursuivre votre déclaration.")}
${ctaButton({
        label: "Commencer ma déclaration",
        href: `${getPublicUrl()}/mon-espace`,
    })}
${paragraph("Cordialement,<br>L'équipe Egapro")}
`;
    return {
        subject,
        html: wrapEmail({
            title: subject,
            intro: `La campagne de déclaration des indicateurs de l'égalité professionnelle pour l'année ${payload.year} est désormais ouverte.`,
            body,
        }),
    };
};
