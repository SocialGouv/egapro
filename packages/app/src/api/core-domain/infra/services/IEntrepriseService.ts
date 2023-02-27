import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { Siret } from "@common/core-domain/domain/valueObjects/Siret";
import type { CodeNaf } from "@common/models/generated";
import type { Service } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

type EtatAdministratif = "A" | "C" | "F";
export interface Convention {
  etat: string;
  id: string;
  idcc: number;
  mtime: number;
  shortTitle: string;
  texte_de_base: string;
  title: string;
  url: string;
}

export interface BaseInfo {
  activitePrincipale?: string;
  activitePrincipaleUniteLegale: CodeNaf;
  caractereEmployeurUniteLegale: string; // "N";
  categorieJuridiqueUniteLegale: string; // "1000";
  codeCommuneEtablissement: string;
  codePostalEtablissement: string;
  conventions: Convention[];
  dateCessation?: string;
  dateCreationUniteLegale: string;
  dateDebut: string;
  etablissements: number;
  etatAdministratifUniteLegale: EtatAdministratif;
  highlightLabel: string;
  label: string;
  libelleCommuneEtablissement: string;
  matching: number;
  simpleLabel: string;
  siren: string;
}

export interface Entreprise extends BaseInfo {
  allMatchingEtablissements: ShortEtablissement[];
  firstMatchingEtablissement?: ShortEtablissement;
}

export interface ShortEtablissement {
  activitePrincipaleEtablissement: CodeNaf;
  address: string;
  categorieEntreprise?: string;
  etablissementSiege: boolean;
  idccs?: number[];
  siret: string;
}

export interface Etablissement extends BaseInfo, ShortEtablissement {
  etatAdministratifEtablissement: EtatAdministratif;
}

export interface SearchParameters {
  /**
   * @description Localisation de l'entreprise
   * @example Lyon
   */
  address?: string;
  /**
   * @description Retourne uniquement les établissements avec une convention collective déclarée
   * @example false
   */
  convention?: boolean;
  /**
   * @description Retourne uniquement les établissements avec des employés déclarés
   * @example false
   */
  employer?: boolean;
  /**
   * @description Nombre de résultats max
   * @example 100
   */
  limit?: number;
  /**
   * @description Nombre d'établissements connexes inclus dans la réponse, -1 pour tous les établissements
   * @example 100
   */
  matchingLimit?: number;
  /**
   * @description Retourne uniquement les établissements ouverts
   * @example false
   */
  open?: boolean;
  /**
   * @description Texte de la recherche
   * @example Michelin
   */
  query: string;
  /**
   * @description Si 'true', ordonne les résultats par taille d'établissement, basée sur la tranche effectif de l'unité légale. Si 'false', ordonné par SIRET décroissant.
   * @example true
   */
  ranked?: boolean;
}

export interface IEntrepriseService extends Service {
  search(parameters: SearchParameters): Promise<Entreprise[]>;

  siren(siren: Siren): Promise<Entreprise>;

  siret(siret: Siret): Promise<Etablissement>;
}

export class EntrepriseServiceError extends AppError {}
export class EntrepriseServiceNotFoundError extends AppError {}
