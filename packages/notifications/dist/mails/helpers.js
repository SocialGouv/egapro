export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
export function formatSiren(siren) {
    const digits = String(siren ?? "").replace(/\D/g, "");
    return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}
export function formatFrenchDate(iso) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}
export function getPublicUrl() {
    const url = process.env.EGAPRO_PUBLIC_URL ?? "https://egapro.travail.gouv.fr";
    return url.replace(/\/$/, "");
}
