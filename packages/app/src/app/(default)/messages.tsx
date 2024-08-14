export const API_ERROR = "Une erreur serveur est survenue. Veuillez réessayer.";

export const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren.";
export const MANDATORY_RESULT = "Le résultat est obligatoire";
export const NOT_BELOW_N_RESULT = (n: number) => `Le résultat ne peut pas être inférieur à ${n}`;
export const NOT_BELOW_0 = NOT_BELOW_N_RESULT(0);
export const MANDATORY_FAVORABLE_POPULATION = "La population envers laquelle l'écart est favorable est obligatoire";
export const NOT_HIGHER_THAN_N_RESULT = (n: number) => `Le résultat ne peut pas être supérieur à ${n}`;
export const NOT_ALL_EMPTY_CATEGORIES = "Au moins une catégorie doit avoir un écart renseigné";
export const MANDATORY_SIREN = "Le Siren est requis";
export const INVALID_SIREN = "Le Siren n'est pas valide";
