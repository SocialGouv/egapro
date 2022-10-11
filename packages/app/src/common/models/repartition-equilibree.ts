import type { COUNTIES, COUNTRIES, NAF, REGIONS } from "../dict";

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

type IndicateursRepartitionEquilibree = {
  motif_non_calculabilité_cadres: "aucun_cadre_dirigeant" | "un_seul_cadre_dirigeant" | undefined;
  motif_non_calculabilité_membres: "aucune_instance_dirigeante" | undefined;
  pourcentage_femmes_cadres: number;
  pourcentage_femmes_membres: number;
  pourcentage_hommes_cadres: number;
  pourcentage_hommes_membres: number;
};
