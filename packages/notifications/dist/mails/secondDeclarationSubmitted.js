import { formatSiren, getPublicUrl } from "./helpers.js";
import { calloutWarning, ctaButton, infoList, paragraph, wrapEmail, } from "./shell.js";
export const buildSecondDeclarationSubmittedMail = (payload) => {
    const subject = `Confirmation — Seconde déclaration ${payload.year}`;
    const body = `
${infoList([
        { label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
        { label: "Année de déclaration", value: payload.year },
    ])}
${calloutWarning("Vous restez tenus aux obligations complémentaires liées à l'écart constaté (mesures de correction, suivi annuel).")}
${ctaButton({
        label: "Accéder à mon espace",
        href: `${getPublicUrl()}/mon-espace`,
    })}
${paragraph("Cordialement,<br>L'équipe Egapro")}
`;
    return {
        subject,
        html: wrapEmail({
            title: subject,
            intro: "Votre seconde déclaration a bien été enregistrée sur la plateforme.",
            body,
        }),
    };
};
