import type { COUNTIES, COUNTRIES, NAF, REGIONS } from "@common/dict";

export type RepartitionEquilibreeAPI = {
  data: RepartitionEquilibreeDataField;
  declared_at: number;
  modified_at: number;
  siren: string;
  year: number;
};

type Declarant = {
  email: string;
  nom: string;
  prénom: string;
  téléphone: string;
};

type Entreprise = {
  adresse: string;
  code_naf: keyof typeof NAF;
  code_pays?: keyof typeof COUNTRIES | undefined;
  code_postal?: string | undefined;
  commune: string;
  département: keyof typeof COUNTIES;
  raison_sociale: string;
  région: keyof typeof REGIONS;
  siren: string;
};

export type RepartitionEquilibreeDataField = {
  déclarant: Declarant;
  déclaration: DeclarationRepartitionEquilibree;
  entreprise: Entreprise;
  répartition_équilibrée: IndicateursRepartitionEquilibree;
  source: "répartition_équilibrée";
};

type DeclarationRepartitionEquilibree = {
  année_indicateurs: number;
  fin_période_référence: Date;
  publication: PublicationRepartitionEquilibree;
};

type PublicationRepartitionEquilibree = {
  date: string;
  modalités?: string | undefined;
  url?: string | undefined;
};

export const motifNonCalculabiliteCadresOptions = [
  {
    label: "Aucun cadre dirigeant",
    value: "aucun_cadre_dirigeant",
  },
  {
    label: "Un seul cadre dirigeant",
    value: "un_seul_cadre_dirigeant",
  },
] as const;

export const motifNonCalculabiliteMembresOptions = [
  {
    label: "Aucune instance dirigeante",
    value: "aucune_instance_dirigeante",
  },
] as const;

type IndicateursRepartitionEquilibree = {
  motif_non_calculabilité_cadres: typeof motifNonCalculabiliteCadresOptions[number]["value"] | undefined;
  motif_non_calculabilité_membres: typeof motifNonCalculabiliteMembresOptions[number]["value"] | undefined;
  pourcentage_femmes_cadres: number;
  pourcentage_femmes_membres: number;
  pourcentage_hommes_cadres: number;
  pourcentage_hommes_membres: number;
};
