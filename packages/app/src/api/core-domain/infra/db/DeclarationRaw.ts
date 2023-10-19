import { type CorrectiveMeasures } from "@common/core-domain/domain/valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { type DeclarationSource } from "@common/core-domain/domain/valueObjects/declaration/DeclarationSource";

import { type CodeDepartement } from "./CodeDepartement";
import { type CodeNaf } from "./CodeNaf";
import { type CodePays } from "./CodePays";
import { type CodeRegion } from "./CodeRegion";

export type AnneeIndicateur = 2018 | 2019 | 2020 | 2021 | 2022;

export interface BaseIndicateurNote {
  note?: number;
  objectif_de_progression?: string;
  résultat?: number;
}

export type PopulationFavorable = "" | "femmes" | "hommes";

export type WithPopulationFavorable = {
  population_favorable?: PopulationFavorable;
};

export type EntrepriseSummary = {
  raison_sociale: string;
  siren: string;
};

export interface Ues {
  entreprises?: EntrepriseSummary[];
  nom?: string;
}

export type Entreprise = {
  adresse?: string;
  code_naf: CodeNaf;
  code_pays?: CodePays;
  code_postal?: string;
  commune?: string;
  département?: CodeDepartement;
  effectif: Effectif;
  /**
   * L'entreprise ou une entreprise de l'UES a-t-elle bénéficié d'une aide dans le cadre du plan de relance
   */
  plan_relance?: boolean;
  raison_sociale: string;
  région?: CodeRegion;
  siren: string;
  ues?: Ues;
};

export interface Effectif {
  /**
   * Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence
   */
  total?: number;
  /**
   * Tranche d'effectifs de la structure
   */
  tranche: "50:250" | "251:999" | "1000:";
}

export interface Publication {
  /**
   * Date de publication du niveau de résultat de l'entreprise ou de l'UES
   */
  date?: string;
  date_publication_mesures?: string;
  date_publication_objectifs?: string;
  modalités?: string;
  modalités_objectifs_mesures?: string;
  url?: string;
}

/**
 * Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes
 */
export type Remunerations = BaseIndicateurNote &
  WithPopulationFavorable & {
    catégories?: Array<{
      nom?: string;
      tranches?: {
        "30:39"?: number;
        "40:49"?: number;
        "50:"?: number;
        ":29"?: number;
      };
    }>;
    /**
     * Uniquement pour les modalités de calcul par niveau ou coefficient hiérarchique en application de la classification de branche ou d'une autre méthode de cotation des postes
     */
    date_consultation_cse?: string;
    mode?: "csp" | "niveau_autre" | "niveau_branche";
    /**
     * Vide ou egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total
     */
    non_calculable?: "egvi40pcet";
  };

/**
 * Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les homme
 */
export type Augmentations = BaseIndicateurNote &
  WithPopulationFavorable & {
    catégories?: CategoriesSimples;
    /**
     * Trois items : Effectif des groupes valides inférieur à 40% de l'effectif total (egvi40pcet) ou Absence d'augmentations individuelles (absaugi)
     */
    non_calculable?: "absaugi" | "egvi40pcet";
  };

export type CategoriesSimples = [ouv: number | null, emp: number | null, tam: number | null, ic: number | null];

/**
 * Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes
 */
export type Promotions = BaseIndicateurNote &
  WithPopulationFavorable & {
    catégories?: CategoriesSimples;
    non_calculable?: "absprom" | "egvi40pcet";
  };

/**
 * Indicateur 2et3 relatif à l'écart de taux d'augmentations individuelles entre les femmes et les homme pour les entreprises de 250 salariés ou moins
 */
export type AugmentationsEtPromotions = BaseIndicateurNote &
  WithPopulationFavorable & {
    /**
     * Trois items : Effectif des groupes valides inférieur à 40% de l'effectif total (egvi40pcet) ou Absence d'augmentations individuelles (absaugi)
     */
    non_calculable?: "absaugi" | "etsno5f5h";
    note_en_pourcentage?: number;
    note_nombre_salariés?: number;
    résultat_nombre_salariés?: number;
  };

/**
 * Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé de maternité
 */
export type CongesMaternite = BaseIndicateurNote & {
  non_calculable?: "absaugpdtcm" | "absrcm";
};
/**
 * Indicateur 5 relatif au nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations
 */
export type HautesRemunerations = Pick<BaseIndicateurNote, "objectif_de_progression"> &
  Required<Pick<BaseIndicateurNote, "note" | "résultat">> &
  WithPopulationFavorable;

/**
 * Representation of a declaration in db.
 */
export interface DeclarationRaw {
  data: DeclarationDataRaw;
  declarant: string;
  declared_at: Date;
  /** @deprecated */
  draft?: DeclarationDataRaw;
  ft: string;
  /** @deprecated */
  legacy?: DeclarationDataRaw;
  modified_at: Date;
  siren: string;
  year: number;
}

export interface DeclarationDataRaw {
  déclarant: {
    email: string;
    nom?: string;
    prénom?: string;
    téléphone?: string;
  };
  déclaration: {
    année_indicateurs: AnneeIndicateur;
    /**
     * Une déclaration en brouillon ne sera pas considérée par les services de la DGT et les validations croisées globales ne seront pas effectuées
     * @deprecated
     */
    brouillon?: boolean;
    /**
     * Date de validation et de transmission des résultats au service Egapro
     * @deprecated see declared_at
     */
    date?: string;
    /**
     * Date de fin de la période de référence considérée pour le calcul des indicateurs
     */
    fin_période_référence?: string;
    /**
     * Résultat final sur 100 points
     */
    index?: number;
    /**
     * Mesures de corrections prévues à l'article D. 1142-6 / Trois items : Mesures mises en œuvre (mmo), Mesures envisagées (me), Mesures non envisagées (mne)
     */
    mesures_correctives?: CorrectiveMeasures.Enum;
    /**
     * Nombre total de points obtenus
     */
    points?: number;
    /**
     * Nombre total de points pouvant être obtenus
     */
    points_calculables?: number;
    publication?: Publication;
    /**
     * Vaut false si l'entreprise à moins de 12 mois d'existence sur la période de calcul considérée
     */
    période_suffisante?: boolean;
  };
  entreprise: Entreprise;
  /** @deprecated - only use for legacy simulator */
  id?: string;
  indicateurs?: {
    augmentations?: Augmentations;
    augmentations_et_promotions?: AugmentationsEtPromotions;
    congés_maternité?: CongesMaternite;
    hautes_rémunérations?: HautesRemunerations;
    promotions?: Promotions;
    rémunérations?: Remunerations;
  };
  source: DeclarationSource.Enum;
}
