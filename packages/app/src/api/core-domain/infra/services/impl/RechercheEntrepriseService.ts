import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type Siret } from "@common/core-domain/domain/valueObjects/Siret";
import { type Objectize } from "@common/utils/types";
import { StatusCodes } from "http-status-codes";
import { stringify } from "querystring";

import {
  type BaseInfo,
  type Convention,
  type Entreprise,
  EntrepriseServiceError,
  EntrepriseServiceNotFoundError,
  type Etablissement,
  type EtatAdministratif,
  type IEntrepriseService,
  type SearchParameters,
  type ShortEtablissement,
} from "../IEntrepriseService";

const RECHERCHE_ENTREPRISE_URL = new URL("https://recherche-entreprises.api.gouv.fr/");

export class RechercheEntrepriseService implements IEntrepriseService {
  public async search(parameters: SearchParameters): Promise<Entreprise[]> {
    // TODO try/catch wrap in decorator
    try {
      const apiParams: Record<string, string | number | boolean> = {
        q: `${parameters.query}${parameters.address ? ` ${parameters.address}` : ''}`.trim(),
        per_page: parameters.limit ?? 100,
        limite_matching_etablissements: parameters.matchingLimit ?? 100,
      };

      if (parameters.convention) {
        apiParams.convention_collective_renseignee = true;
      }

      const stringifiedParams = new URLSearchParams(
        Object.entries(apiParams).map(([k, v]) => [k, String(v)])
      ).toString();
      const url = new URL(`search?${stringifiedParams}`, RECHERCHE_ENTREPRISE_URL);

      const response = await fetch(url, {
        headers: {
          Referer: "egapro",
        },
      });

      if (!response.ok) {
        if (response.status === StatusCodes.NOT_FOUND) {
          throw new EntrepriseServiceNotFoundError(`Search led to not found.`);
        }
        throw new EntrepriseServiceError(`Search failed (${stringifiedParams}).`);
      }

      const data = await response.json();
      let entreprises = (data.results || []).map(this.mapToEntreprise.bind(this));

      // Post-filter for employer
      if (parameters.employer !== undefined) {
        const targetEmployeur = parameters.employer ? "O" : "N";
        entreprises = entreprises.filter(
          (e) => e.caractereEmployeurUniteLegale === targetEmployeur
        );
      }

      // Post-filter for open (only filter if true, to match "uniquement les ouverts")
      if (parameters.open === true) {
        entreprises = entreprises.filter((e) => e.etatAdministratifUniteLegale === "A");
      }

      // Sort if ranked
      if (parameters.ranked) {
        entreprises.sort((a, b) => b.etablissements - a.etablissements);
      } else {
        // Default sort by SIREN descending
        entreprises.sort((a, b) => b.siren.localeCompare(a.siren));
      }

      return entreprises.slice(0, parameters.limit ?? 100);
    } catch (error: unknown) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError("Unknown search error.", error as Error);
    }
  }

  public async siren(siren: Siren): Promise<Entreprise> {
    try {
      const validatedSiren = siren.getValue();
      const stringifiedParams = new URLSearchParams({ q: validatedSiren, per_page: "1" }).toString();
      const url = new URL(`search?${stringifiedParams}`, RECHERCHE_ENTREPRISE_URL);

      const response = await fetch(url, {
        headers: {
          Referer: "egapro",
        },
      });

      if (!response.ok) {
        if (response.status === StatusCodes.NOT_FOUND) {
          throw new EntrepriseServiceNotFoundError(`Siren not found. (${validatedSiren})`);
        }
        throw new EntrepriseServiceError(`Siren failed (${validatedSiren}).`);
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new EntrepriseServiceNotFoundError(`Siren not found. (${validatedSiren})`);
      }
      return this.mapToEntreprise(data.results[0]);
    } catch (error: unknown) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError("Unknown Siren error.", error as Error);
    }
  }

  public async siret(siret: Siret): Promise<Etablissement> {
    try {
      const validatedSiret = siret.getValue();
      const stringifiedParams = new URLSearchParams({ q: validatedSiret, per_page: "1" }).toString();
      const url = new URL(`search?${stringifiedParams}`, RECHERCHE_ENTREPRISE_URL);

      const response = await fetch(url, {
        headers: {
          Referer: "egapro",
        },
      });

      if (!response.ok) {
        if (response.status === StatusCodes.NOT_FOUND) {
          throw new EntrepriseServiceNotFoundError(`Siret not found. (${validatedSiret})`);
        }
        throw new EntrepriseServiceError(`Siret failed (${validatedSiret}).`);
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new EntrepriseServiceNotFoundError(`Siret not found. (${validatedSiret})`);
      }
      const uniteLegale = data.results[0];
      if (!uniteLegale.matching_etablissements || uniteLegale.matching_etablissements.length === 0) {
        throw new EntrepriseServiceNotFoundError(`Siret not found. (${validatedSiret})`);
      }
      const etabData = uniteLegale.matching_etablissements.find(e => e.siret === validatedSiret);
      if (!etabData) {
        throw new EntrepriseServiceNotFoundError(`Siret not found. (${validatedSiret})`);
      }
      return this.mapToEtablissementFromUniteLegale(uniteLegale, etabData);
    } catch (error: unknown) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError("Unknown Siret error.", error as Error);
    }
  }
  
    private mapToShortEtablissement(etab: any): ShortEtablissement {
      return {
        activitePrincipaleEtablissement: etab.activite_principale,
        address: etab.adresse || "",
        codeCommuneEtablissement: etab.commune || "",
        codePaysEtrangerEtablissement: etab.code_pays_etranger,
        codePostalEtablissement: etab.code_postal || "",
        etablissementSiege: etab.est_siege || false,
        idccs: etab.liste_idcc || [],
        libelleCommuneEtablissement: etab.libelle_commune || "",
        siret: etab.siret || "",
        // categorieEntreprise optional, skip if not present
      };
    }
  
    private mapConvention(idccStr: string): Convention {
      const idcc = parseInt(idccStr, 10);
      return {
        etat: "",
        id: idccStr,
        idcc,
        mtime: 0,
        shortTitle: "",
        texte_de_base: "",
        title: "",
        url: "",
      };
    }
  
    private mapToEntreprise(item: any): Entreprise {
      const conventions = item.complements?.liste_idcc
        ? item.complements.liste_idcc.map(this.mapConvention.bind(this))
        : [];
  
      const base: BaseInfo = {
        activitePrincipale: item.activite_principale,
        activitePrincipaleUniteLegale: item.activite_principale,
        caractereEmployeurUniteLegale: item.caractere_employeur || "N",
        categorieJuridiqueUniteLegale: item.nature_juridique || "",
        conventions,
        dateCreationUniteLegale: item.date_creation || "",
        dateDebut: item.date_creation || "",
        etablissements: item.nombre_etablissements || 0,
        etatAdministratifUniteLegale: (item.etat_administratif || "A") as EtatAdministratif,
        label: item.nom_complet || "",
        simpleLabel: item.nom_raison_sociale || "",
        highlightLabel: item.nom_complet || "",
        matching: item.matching_etablissements?.length || 0,
        siren: item.siren || "",
      };
  
      if (item.date_fermeture) {
        base.dateCessation = item.date_fermeture;
      }
  
      const allMatchingEtablissements = item.matching_etablissements
        ? item.matching_etablissements.map(this.mapToShortEtablissement.bind(this))
        : [];
  
      const firstMatchingEtablissement = allMatchingEtablissements[0] || this.mapToShortEtablissement(item.siege);
  
      return {
        ...base,
        allMatchingEtablissements,
        firstMatchingEtablissement,
      };
    }
  
    private mapToEtablissementFromUniteLegale(uniteLegale: any, etabData: any): Etablissement {
      const short = this.mapToShortEtablissement(etabData);
  
      const conventions = etabData.liste_idcc
        ? etabData.liste_idcc.map(this.mapConvention.bind(this))
        : uniteLegale.complements?.liste_idcc
        ? uniteLegale.complements.liste_idcc.map(this.mapConvention.bind(this))
        : [];
  
      const base: BaseInfo = {
        activitePrincipale: etabData.activite_principale,
        activitePrincipaleUniteLegale: uniteLegale.activite_principale,
        caractereEmployeurUniteLegale: uniteLegale.caractere_employeur || "N",
        categorieJuridiqueUniteLegale: uniteLegale.nature_juridique || "",
        conventions,
        dateCreationUniteLegale: uniteLegale.date_creation || "",
        dateDebut: etabData.date_debut_activite || etabData.date_creation || uniteLegale.date_creation || "",
        etablissements: 1,
        etatAdministratifUniteLegale: (uniteLegale.etat_administratif || "A") as EtatAdministratif,
        label: etabData.nom_commercial || etabData.adresse || "",
        simpleLabel: etabData.nom_commercial || "",
        highlightLabel: etabData.nom_commercial || etabData.adresse || "",
        matching: 1,
        siren: uniteLegale.siren || "",
      };
  
      if (etabData.date_fermeture || uniteLegale.date_fermeture) {
        base.dateCessation = etabData.date_fermeture || uniteLegale.date_fermeture;
      }
  
      return {
        ...base,
        ...short,
        etatAdministratifEtablissement: (etabData.etat_administratif || "A") as EtatAdministratif,
      };
    }
}
