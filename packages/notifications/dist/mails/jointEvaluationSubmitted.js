import { formatSiren, getPublicUrl } from "./helpers.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./shell.js";
export const buildJointEvaluationSubmittedMail = (payload) => {
    const subject = `Confirmation — Évaluation conjointe transmise (${payload.year})`;
    const body = `
${infoList([
        { label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
        { label: "Année concernée", value: payload.year },
    ])}
${paragraph("L'évaluation conjointe associée à votre déclaration a bien été enregistrée.")}
${ctaButton({
        label: "Voir ma déclaration",
        href: `${getPublicUrl()}/mon-espace`,
    })}
${paragraph("Cordialement,<br>L'équipe Egapro")}
`;
    return {
        subject,
        html: wrapEmail({
            title: subject,
            intro: "Nous accusons réception du dépôt de l'évaluation conjointe.",
            body,
        }),
    };
};
