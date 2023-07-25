import { type RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type DeclarationDTO, type PopulationFavorable } from "@common/models/generated";
import { type EmptyObject } from "@common/utils/types";

import { buildEntreprise, type Entreprise } from "./entreprise";

type OuiNon = "non" | "oui";

export const TrancheOptions = [
  { label: "De 50 à 250 inclus", value: "50:250" },
  { label: "De 251 à 999 inclus", value: "251:999" },
  { label: "De 1000 ou plus", value: "1000:" },
] as const;

export type TrancheValues = (typeof TrancheOptions)[number]["value"];

type TranchesAge = {
  "30:39": number | null;
  "40:49": number | null;
  "50:": number | null;
  ":29": number | null;
};

export type Catégorie = { nom: string; tranches: TranchesAge };

export const labelsMotifNC = {
  egvi40pcet: "Effectif des groupes valides inférieur à 40% de l'effectif total",
  absaugi: "Absence d'augmentations individuelles",
  etsno5f5h: "L'entreprise ne comporte pas au moins 5 femmes et 5 hommes",
  absprom: "Absence de promotions",
  absaugpdtcm: "Absence d'augmentations pendant ce congé",
  absrcm: "Absence de retours de congé maternité",
} as const;

type LabelMotifNCKey = keyof typeof labelsMotifNC;

export type IndicatorKey = keyof Pick<
  DeclarationFormState,
  | "augmentations-et-promotions"
  | "augmentations"
  | "conges-maternite"
  | "hautes-remunerations"
  | "promotions"
  | "remunerations"
>;

export type MotifNCKey = Exclude<IndicatorKey, "hautes-remunerations">;

export const motifsNC: Record<MotifNCKey, readonly LabelMotifNCKey[]> = {
  augmentations: ["egvi40pcet", "absaugi"],
  promotions: ["egvi40pcet", "absprom"],
  "augmentations-et-promotions": ["absaugi", "etsno5f5h"],
  remunerations: ["egvi40pcet"],
  "conges-maternite": ["absrcm", "absaugpdtcm"],
} as const;

/**
 * The shape of the state for declaration form.
 */
export type DeclarationFormState = {
  augmentations?: EmptyObject;
  "augmentations-et-promotions"?: {
    estCalculable: OuiNon;
    motifNonCalculabilité?: (typeof motifsNC)["augmentations-et-promotions"][number];
    note: number;
    noteNombreSalaries: number;
    notePourcentage: number;
    populationFavorable: PopulationFavorable;
    résultat: number;
    résultatEquivalentSalarié: number;
  };
  commencer?: {
    annéeIndicateurs: number;
    entrepriseDéclarante?: Entreprise;
  };
  "conges-maternite"?:
    | {
        estCalculable: "non";
        motifNonCalculabilité: (typeof motifsNC)["conges-maternite"][number];
      }
    | {
        estCalculable: "oui";
        note: number;
        résultat: number;
      };
  // Only filled by the backend.
  declarant?: {
    accordRgpd: boolean;
    email: string;
    nom: string;
    prénom: string;
    téléphone: string;
  };
  "declaration-existante": {
    date?: string | undefined;
    status: "consultation" | "creation" | "edition";
  };
  entreprise?: { tranche: TrancheValues; type: "entreprise" | "ues" };
  "hautes-remunerations"?: {
    note: number;
    populationFavorable: PopulationFavorable;
    résultat: number;
  };
  "periode-reference"?:
    | {
        effectifTotal: number;
        finPériodeRéférence: string;
        périodeSuffisante: "oui";
      }
    | {
        périodeSuffisante: "non";
      };
  promotions?: EmptyObject;
  publication?: { date: string; planRelance: OuiNon } & (
    | {
        choixSiteWeb: "non";
        modalités: string;
      }
    | {
        choixSiteWeb: "oui";
        url: string;
      }
  );
  remunerations?: {
    cse?: OuiNon;
    dateConsultationCSE?: string;
    déclarationCalculCSP?: boolean;
    estCalculable: OuiNon;
    // mode?: "csp" | "niveau_autre" | "niveau_branche";
    mode?: RemunerationsMode.Enum;
    motifNonCalculabilité?: (typeof motifsNC)["remunerations"][number];
  };
  "remunerations-coefficient-autre"?: {
    catégories: Catégorie[];
  };

  "remunerations-coefficient-branche"?: {
    catégories: Catégorie[];
  };
  "remunerations-csp"?: {
    catégories: [
      { nom: "ouv"; tranches: TranchesAge },
      { nom: "emp"; tranches: TranchesAge },
      { nom: "tam"; tranches: TranchesAge },
      { nom: "ic"; tranches: TranchesAge },
    ];
  };
  "remunerations-resultat"?: {
    note: number;
    populationFavorable: PopulationFavorable;
    résultat: number;
  };
  "resultat-global"?: {
    index?: number;
    mesures: string;
    points: number;
    pointsCalculables: number;
  };
  ues?: {
    entreprises: Array<{
      raisonSociale: string;
      siren: string;
    }>;
    nom: string;
  };
  "validation-transmission"?: EmptyObject;
};

export const DeclarationFormBuilder = {
  buildDeclaration: (declaration: DeclarationDTO): DeclarationFormState => {
    return {
      commencer: {
        annéeIndicateurs: declaration.déclaration.année_indicateurs,
        entrepriseDéclarante: buildEntreprise(declaration.entreprise),
      },
      "declaration-existante": {
        date: declaration.déclaration.date,
        status: "edition",
      },
      declarant: {
        accordRgpd: true,
        email: declaration.déclarant.email,
        nom: declaration.déclarant.nom || "",
        prénom: declaration.déclarant.prénom || "",
        téléphone: declaration.déclarant.téléphone || "",
      },
      remunerations: {
        estCalculable: declaration.indicateurs?.rémunérations?.non_calculable ? "non" : "oui",
        motifNonCalculabilité: declaration.indicateurs?.rémunérations?.non_calculable,
        cse: declaration.indicateurs?.rémunérations?.date_consultation_cse ? "oui" : undefined,
        dateConsultationCSE: declaration.indicateurs?.rémunérations?.date_consultation_cse,
        déclarationCalculCSP: true, // Always true for an existing declaration.
        mode: declaration.indicateurs?.rémunérations?.mode as RemunerationsMode.Enum, // Always present for an existing declaration.
      },
      "remunerations-csp": {
        // @ts-ignore TODO: improve types
        catégories: declaration.indicateurs?.rémunérations?.catégories,
      },
      "remunerations-coefficient-autre": {
        // @ts-ignore TODO: improve types
        catégories: declaration.indicateurs?.rémunérations?.catégories,
      },
      "remunerations-coefficient-branche": {
        // @ts-ignore TODO: improve types
        catégories: declaration.indicateurs?.rémunérations?.catégories,
      },
      "remunerations-resultat": {
        note: declaration.indicateurs?.rémunérations?.note ?? 0,
        populationFavorable: declaration.indicateurs?.rémunérations?.population_favorable ?? "egalite",
        résultat: declaration.indicateurs?.rémunérations?.résultat ?? 0,
      },
      "augmentations-et-promotions": {
        estCalculable: declaration.indicateurs?.augmentations_et_promotions?.non_calculable ? "non" : "oui",
        motifNonCalculabilité: declaration.indicateurs?.augmentations_et_promotions?.non_calculable,
        note: declaration.indicateurs?.augmentations_et_promotions?.note ?? 0,
        populationFavorable: declaration.indicateurs?.augmentations_et_promotions?.population_favorable ?? "egalite",
        résultat: declaration.indicateurs?.augmentations_et_promotions?.résultat ?? 0,
        résultatEquivalentSalarié: declaration.indicateurs?.augmentations_et_promotions?.résultat_nombre_salariés ?? 0,
        noteNombreSalaries: declaration.indicateurs?.augmentations_et_promotions?.note_nombre_salariés ?? 0,
        notePourcentage: declaration.indicateurs?.augmentations_et_promotions?.note_en_pourcentage ?? 0,
      },
      "conges-maternite": declaration.indicateurs?.congés_maternité?.non_calculable
        ? {
            estCalculable: "non",
            motifNonCalculabilité: declaration.indicateurs?.congés_maternité?.non_calculable,
          }
        : {
            estCalculable: "oui",
            résultat: declaration.indicateurs?.congés_maternité?.résultat ?? 0,
            note: declaration.indicateurs?.congés_maternité?.note ?? 0,
          },
      "hautes-remunerations": {
        populationFavorable: declaration.indicateurs?.hautes_rémunérations?.population_favorable ?? "egalite",
        résultat: declaration.indicateurs?.hautes_rémunérations?.résultat ?? 0,
        note: declaration.indicateurs?.hautes_rémunérations?.note ?? 0,
      },
      entreprise: {
        tranche: declaration.entreprise.effectif!.tranche!, // Always present for an existing declaration.
        type: declaration.entreprise.ues?.nom ? "ues" : "entreprise",
      },
      ues: {
        nom: declaration.entreprise.ues?.nom ?? "",
        entreprises:
          declaration.entreprise.ues?.entreprises?.map(entreprise => ({
            siren: entreprise.siren,
            raisonSociale: entreprise.raison_sociale,
          })) ?? [],
      },
      "periode-reference": declaration.déclaration.période_suffisante
        ? {
            périodeSuffisante: "oui",
            effectifTotal: declaration.entreprise.effectif?.total ?? 0,
            finPériodeRéférence: declaration.déclaration.fin_période_référence ?? "",
          }
        : {
            périodeSuffisante: "non",
          },
      // TODO: les autres indicateurs et autres informations
      "resultat-global": {
        mesures: declaration.déclaration.mesures_correctives || "",
        index: declaration.déclaration?.index,
        points: declaration.déclaration.points || 0,
        pointsCalculables: declaration.déclaration.points_calculables || 0,
      },
      publication: declaration.déclaration.publication?.url
        ? {
            choixSiteWeb: "oui",
            date: declaration.déclaration.publication.date || "",
            url: declaration.déclaration.publication.url,
            planRelance: declaration.entreprise.plan_relance ? "oui" : "non",
          }
        : {
            choixSiteWeb: "non",
            date: declaration.déclaration.publication?.date || "",
            modalités: declaration.déclaration.publication?.modalités || "",
            planRelance: declaration.entreprise.plan_relance ? "oui" : "non",
          },
    };
  },

  //   toDeclaration: (formState: DeclarationFormState): DeclarationDTO => {},
};
