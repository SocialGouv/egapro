import { type Any } from "@common/utils/types";

export type FormState = "Invalid" | "None" | "Valid";

export type Simulation = {
  data: {
    indicateurUn: IndicateurUnOrigin;
  };
  id: string;
};

// Types de données avant migration ------------------------------------------

type CoefficientGroupeOrigin = {
  name: string;
  tranchesAges: Any;
};

// Propriétés inchangées.
export type IndicateurUnBase = {
  coefficientEffectifFormValidated: FormState;
  coefficientGroupFormValidated: FormState;
  formValidated: FormState;
  motifNonCalculable?: string;
  nombreCoefficients?: number;
  nonCalculable?: boolean;
  noteFinale?: number;
  resultatFinal?: number;
  sexeSurRepresente?: "femmes" | "hommes";
};

// Propriétés d'origine.
export type IndicateurUnOrigin = IndicateurUnBase & {
  autre?: boolean;
  coef?: boolean;
  coefficient: CoefficientGroupeOrigin[]; // Uniquement pour modalité coefficient ou autre.
  csp?: boolean;
  modaliteCalcul?: "autre" | "coef" | "csp";
  // Uniquement pour modalité csp
  motifNonCalculablePrecision?: string;
  remunerationAnnuelle: Any[];
};

// Types de données après migration ------------------------------------------

type CoefficientGroupeDestination = {
  nom: string;
  tranchesAges: Any[];
};

// Nouveaux noms des propriétés et nouvelles propriétés.
export type IndicateurUnDestination = IndicateurUnBase & {
  coefficientRemuFormValidated: FormState; // Nouvelle propriété.
  coefficients: CoefficientGroupeDestination[]; // Nouveau nom de la propriété.
  modaliteCalcul: "autre" | "coef" | "csp"; // Nouvelle propriété
  modaliteCalculformValidated: FormState; // Nouvelle propriété.
  remunerationsAnnuelles: Any[]; // Nouveau nom de la propriété.
};

export function updateIndicateurUn(data: IndicateurUnOrigin): IndicateurUnDestination {
  const { csp, coef, autre, coefficient, remunerationAnnuelle, modaliteCalcul, formValidated, ...rest } = data;

  // 1. Recopie des champs inchangés + ajout du champ modaliteCalculformValidated forcément à Valid, puisqu'on ne ne prend en compte que les simulations validées.
  const newIndicateurUn = {
    ...rest,
    formValidated,
    modaliteCalculformValidated: formValidated,
  } as IndicateurUnDestination;

  // 2. Gestion du nouveau champ modaliteCalcul et suppression des champs csp, coef et autre.
  // NB: we don't start with CSP because cases exist with modaliteCalcul="csp" and csp=false. So we check modaliteCalcul === "csp" last.
  if (coef === true || modaliteCalcul === "coef") {
    newIndicateurUn.modaliteCalcul = "coef";
    // 3.1 Gestion du champ coefficientRemuFormValidated pour les modalités coef et autre.
    newIndicateurUn.coefficientRemuFormValidated = formValidated;
  } else if (autre === true || modaliteCalcul === "autre") {
    newIndicateurUn.modaliteCalcul = "autre";
    // 3.2 Gestion du champ coefficientRemuFormValidated pour les modalités coef et autre.
    newIndicateurUn.coefficientRemuFormValidated = formValidated;
  } else if (csp === true || modaliteCalcul === "csp") {
    newIndicateurUn.modaliteCalcul = "csp";
    // 3.3 Gestion du champ coefficientRemuFormValidated pour la modalité csp.
    newIndicateurUn.coefficientRemuFormValidated = "None";
  }

  // 3. Gestion du champ remunerationAnnuelle, qui devient remunerationsAnnuelles.
  if (remunerationAnnuelle !== undefined) {
    newIndicateurUn.remunerationsAnnuelles = remunerationAnnuelle;
  }

  // 4. Gestion du champ coefficient, qui devient coefficients.
  if (coefficient !== undefined) {
    // 5. Gestion du champ name des coefficients, qui devient nom.
    newIndicateurUn.coefficients = coefficient.map(({ name, tranchesAges }) => ({
      nom: name,
      tranchesAges,
    }));
  }

  return newIndicateurUn;
}
