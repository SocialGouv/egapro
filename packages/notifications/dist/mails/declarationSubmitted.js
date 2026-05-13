import { formatSiren, getPublicUrl } from "./helpers.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./shell.js";
export const buildDeclarationSubmittedMail = (payload) => {
    const subject = `Confirmation — Déclaration des indicateurs ${payload.year}`;
    const body = `
${infoList([
        { label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
        { label: "Année de déclaration", value: payload.year },
    ])}
${paragraph("Vous pouvez retrouver le détail de votre déclaration dans votre espace Egapro.")}
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
            intro: "Votre déclaration des indicateurs de l'égalité professionnelle a bien été soumise.",
            body,
        }),
    };
};
