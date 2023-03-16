// Alias
export type Siren = string;
export type Timestamp = number;

// Tranches d'effectifs
export const TRANCHES_EFFECTIFS = [
  { label: "50 à 250", value: "50:250" },
  { label: "251 à 999", value: "251:999" },
  { label: "1000 et plus", value: "1000:" },
] as const;

export type TrancheEffectifsLabel = typeof TRANCHES_EFFECTIFS[number]["label"];
export type TrancheEffectifsValue = typeof TRANCHES_EFFECTIFS[number]["value"];

// Sexe
export const SEXES = ["femmes", "hommes"] as const;
export type Sexe = typeof SEXES[number];

// Motifs de non calculabilité
const MOTIF_NC_MATERNITE = [
  {
    label: "Absence de retours de congé de maternité",
    value: "absrcm",
  },
  { label: "Absence d'augmentations pendant ce congé", value: "absaugpdtcm" },
] as const;
export type MotifNCMaterniteLabel = keyof typeof MOTIF_NC_MATERNITE[number]["label"];
export type MotifNCMaterniteValue = typeof MOTIF_NC_MATERNITE[number]["value"];

export type DeclarationAPI = {
  data: {
    déclarant: {
      email: string;
      nom: string;
      prénom: string;
      téléphone: string;
    };
    déclaration: {
      année_indicateurs?: number;
      brouillon?: boolean;
      date?: string;
      fin_période_référence?: string;
      index?: number;
      mesures_correctives?: string;
      points?: number;
      points_calculables?: number;
      publication?: {
        date?: string;
        date_publication_mesures?: string;
        date_publication_objectifs?: string;
        modalités?: string;
        modalités_objectifs_mesures?: string;
        url?: string;
      };
      période_suffisante?: boolean; // undefined si période_suffisante est à false.
    };
    entreprise: {
      adresse: string;
      code_naf: string;
      code_pays?: string;
      code_postal?: string;
      commune: string;
      département: string;
      effectif: {
        total?: any;
        tranche: TrancheEffectifsValue;
      };
      plan_relance?: boolean;
      raison_sociale: string;
      région: string;
      siren: string;
      ues?: {
        entreprises: Array<{
          raison_sociale: string;
          siren: string;
        }>;
        nom: string;
      };
    };
    id?: string; // id de la simulation initiale !! N'est pas rendu par l'API pour GET /declaration
    indicateurs?: Indicateurs;
    source: "formulaire" | "simulateur";
  };
  declared_at: Timestamp;
  modified_at: Timestamp;
  siren: Siren;
  year: number;
};

export type Indicateurs = {
  augmentations?: Indicateur2;
  augmentations_et_promotions?: Indicateur2et3;
  congés_maternité: Indicateur4;

  hautes_rémunérations: Indicateur5;
  promotions?: Indicateur3;
  rémunérations: Indicateur1;
};

// Motifs NC indicateur 1: egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total
export type Indicateur1 =
  | {
      catégories?: Array<{
        nom: string;
        tranches?: {
          "30:39"?: number;
          "40:49"?: number;
          "50:"?: number;
          ":29"?: number;
        };
      }>;
      date_consultation_cse?: string;
      mode: string;
      note?: number;
      objectif_de_progression?: string;
      population_favorable?: Sexe;
      résultat?: number;
    }
  | {
      non_calculable: "egvi40pcet";
    };

// Motifs NC indicateur 2: egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total | absaugi: Absence d'augmentations individuelles
export type Indicateur2 =
  | {
      catégories: Array<number | undefined>;
      note?: number;
      objectif_de_progression?: string;
      population_favorable?: Sexe;
      résultat?: number;
    }
  | { non_calculable: "absaugi" | "egvi40pcet" };

// Motifs NC indicateur 3: egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total | absprom: Absence de promotions
export type Indicateur3 =
  | {
      catégories: Array<number | undefined>;
      note?: number;
      objectif_de_progression?: string;
      population_favorable?: Sexe;
      résultat?: number;
    }
  | { non_calculable: "absprom" | "egvi40pcet" };

// Motifs NC indicateur 2 et 3: etsno5f5h: L'entreprise ne comporte pas au moins 5 femmes et 5 hommes | absaugi: Absence d'augmentations individuelles
export type Indicateur2et3 =
  | {
      note?: number;
      note_en_pourcentage?: number;
      note_nombre_salariés?: number;
      objectif_de_progression?: string;
      population_favorable?: Sexe;
      résultat?: number;
      résultat_nombre_salariés?: number;
    }
  | { non_calculable: "absaugi" | "etsno5f5h" };

// Motifs NC indicateur 4: absrcm: Absence de retours de congé de maternité | absaugpdtcm: Absence d'augmentations pendant ce congé
export type Indicateur4 =
  | {
      note?: number;
      objectif_de_progression?: string;
      résultat?: number;
    }
  | { non_calculable: "absaugpdtcm" | "absrcm" };

export type Indicateur5 = {
  note?: number;
  objectif_de_progression?: string;
  population_favorable?: Sexe;
  résultat?: number;
};
