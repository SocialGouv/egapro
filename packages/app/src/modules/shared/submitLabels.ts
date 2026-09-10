// Le verbe de l'envoi, pour les boutons et les titres de modale des trois
// parcours. Une constante plutôt que le littéral recopié : c'est la duplication
// qui avait laissé « Soumettre » et « Transmettre » diverger (#4425).
// Pas de "use client" ici — des Server Components peuvent l'employer.
export const SUBMIT_LABEL = "Transmettre";
