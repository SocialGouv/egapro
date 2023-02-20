import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { Siret } from "@common/core-domain/domain/valueObjects/Siret";
import type { CodeNaf } from "@common/models/generated";
import type { Service } from "@common/shared-domain";

export interface Entreprise {
  activitePrincipale: string;
  activitePrincipaleUniteLegale: CodeNaf;
  allMatchingEtablissements: [
    {
      activitePrincipaleEtablissement: CodeNaf;
      address: string;
      codeCommuneEtablissement: string;
      codePostalEtablissement: string;
      etablissementSiege: true;
      libelleCommuneEtablissement: string;
      siret: string;
    },
  ];
  caractereEmployeurUniteLegale: "N";
  categorieJuridiqueUniteLegale: "1000";
  conventions: [];
  dateCreationUniteLegale: string;
  dateDebut: string;
  etablissements: 1;
  etatAdministratifUniteLegale: "A";
  firstMatchingEtablissement: {
    activitePrincipaleEtablissement: CodeNaf;
    address: string;
    codeCommuneEtablissement: string;
    codePostalEtablissement: string;
    etablissementSiege: true;
    etatAdministratifEtablissement: "A";
    idccs: [];
    libelleCommuneEtablissement: string;
    siret: string;
  };
  highlightLabel: string;
  label: string;
  matching: 1;
  simpleLabel: string;
  siren: string;
}

export interface Etablissement {
  activitePrincipale: string;
  activitePrincipaleEtablissement: CodeNaf;
  activitePrincipaleUniteLegale: CodeNaf;
  address: string;
  caractereEmployeurUniteLegale: "N";
  categorieJuridiqueUniteLegale: "1000";
  codeCommuneEtablissement: string;
  codePostalEtablissement: string;
  conventions: [];
  dateCreationUniteLegale: string;
  dateDebut: string;
  etablissementSiege: true;
  etablissements: 1;
  etatAdministratifEtablissement: "A";
  etatAdministratifUniteLegale: "A";
  highlightLabel: string;
  idccs: [];
  label: string;
  libelleCommuneEtablissement: string;
  matching: 1;
  simpleLabel: string;
  siren: string;
  siret: string;
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

export class RechercheEntrepriseService implements Service {
  search(parameters: SearchParameters) {}
  siren(siren: Siren) {}
  siret(siret: Siret) {}
}
