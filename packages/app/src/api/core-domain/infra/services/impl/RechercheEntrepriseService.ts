// packages/app/src/api/core-domain/infra/services/impl/RechercheEntrepriseService.ts

import { stringify } from "querystring";
import { StatusCodes } from "http-status-codes";

import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Siret } from "@common/core-domain/domain/valueObjects/Siret";

import {
  IEntrepriseService,
  SearchParameters,
  Entreprise,
  Etablissement,
  ShortEtablissement,
  EntrepriseServiceError,
  EntrepriseServiceNotFoundError,
} from "../IEntrepriseService";

const BASE_URL = "https://dgt.rct01.kleegroup.com/weez/api/public/next";

export class RechercheEntrepriseService implements IEntrepriseService {
  /* =====================================================
   * 🔍 Recherche textuelle
   * ===================================================== */
  async search(parameters: SearchParameters): Promise<Entreprise[]> {
    try {
      const url = new URL(`${BASE_URL}/unitelegale/search`);
      url.search = stringify({
        query: parameters.query,
        page: 0,
        inclure_cesse: true,
        inclure_non_diffusibles: true,
      });

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new EntrepriseServiceError(
          `Erreur recherche entreprises (${res.status})`,
        );
      }

      const data = await res.json();
      return (data.content ?? []).map((u: any) =>
        this.mapUniteLegaleToEntreprise(u),
      );
    } catch (error) {
      throw new EntrepriseServiceError(
        "Erreur inconnue recherche entreprises",
        error as Error,
      );
    }
  }

  /* =====================================================
   * 🔎 Recherche par SIREN
   * ===================================================== */
  async siren(siren: Siren): Promise<Entreprise> {
    try {
      const url = new URL(`${BASE_URL}/unitelegale/findbysiren`);
      url.search = stringify({
        siren: siren.getValue(),
        page: 0,
        inclure_cesse: true,
        inclure_non_diffusibles: true,
      });

      const res = await fetch(url.toString());

      if (res.status === StatusCodes.NOT_FOUND) {
        throw new EntrepriseServiceNotFoundError(
          `Entreprise non trouvée (SIREN ${siren.getValue()})`,
        );
      }

      if (!res.ok) {
        throw new EntrepriseServiceError(
          `Erreur récupération entreprise ${siren.getValue()}`,
        );
      }

      const data = await res.json();
      if (!data.content?.length) {
        throw new EntrepriseServiceNotFoundError(
          `Entreprise non trouvée (SIREN ${siren.getValue()})`,
        );
      }

      return this.mapUniteLegaleToEntreprise(data.content[0]);
    } catch(e) {
      console.error(e)
      throw e
    }
    
  }

  /* =====================================================
   * 🏢 Recherche par SIRET
   * ===================================================== */
  async siret(siret: Siret): Promise<Etablissement> {
    try {
      const url = new URL(`${BASE_URL}/etablissement/findbysiret`);
      url.search = stringify({
        siret: siret.getValue(),
        page: 0,
        inclure_cesse: true,
        inclure_non_diffusibles: true,
      });

      const res = await fetch(url.toString());

      if (res.status === StatusCodes.NOT_FOUND) {
        throw new EntrepriseServiceNotFoundError(
          `Établissement non trouvé pour le SIRET ${siret.getValue()}`,
        );
      }

      if (!res.ok) {
        throw new EntrepriseServiceError(
          `Erreur lors de la récupération de l'établissement ${siret.getValue()}`,
        );
      }

      const data = await res.json();

      if (!data.content?.length) {
        throw new EntrepriseServiceNotFoundError(
          `Établissement non trouvé pour le SIRET ${siret.getValue()}`,
        );
      }

      return this.mapEtablissement(data.content[0]);
    } catch (error) {
      console.error(error)
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError(
        `Erreur inconnue lors de la recherche par SIRET ${siret.toString()}`,
        error as Error,
      );
    }
  }

  /* =====================================================
   * 🔄 Mapping Weez → Domaine
   * ===================================================== */

  private mapUniteLegaleToEntreprise(u: any): Entreprise {
    const addressFields = this.extractAddressFields(u);
    const etab: ShortEtablissement = {
      siret: `${u.siren}${u.nicsiegeunitelegale}`,
      etablissementSiege: true,
      activitePrincipaleEtablissement: u.activiteprincipaleunitelegale,
      address: addressFields.adress,
      city: addressFields.city,
      postalCode: addressFields.postalCode,
      countryIsoCode: addressFields.countryIsoCode,
      codeCommuneEtablissement: u.codecommune ?? "",
      libelleCommuneEtablissement: u.libellecommune,
      categorieEntreprise: u.categorieentreprise,
    };

    const simpleLabel =
      u.denominationunitelegale ?? u.nomunitelegale ?? u.raisonsociale ?? "";

    return {
      siren: u.siren,

      label: `${simpleLabel} (${u.siren})`,
      simpleLabel,
      highlightLabel: simpleLabel,
      matching: 1,

      activitePrincipaleUniteLegale: u.activiteprincipaleunitelegale,
      categorieJuridiqueUniteLegale: u.categoriejuridiqueunitelegale,
      caractereEmployeurUniteLegale: u.caractereemployeurunitelegale,
      etatAdministratifUniteLegale: u.etatadministratifunitelegale,
      dateCreationUniteLegale: u.datecreationunitelegale,
      dateDebut: u.datedebut,
      etablissements: 1,
      conventions: [],

      allMatchingEtablissements: [etab],
      firstMatchingEtablissement: etab,
    };
  }

  private extractAddressFields(e: any) {
  return {
    adress: [
      e.numerovoieetablissement,
      e.typevoieetablissement,
      e.libellevoieetablissement,
    ]
      .filter(Boolean)
      .join(" "),

    city: e.libellecommuneetablissement ?? null,

    postalCode: e.codepostaletablissement ?? null,

    countryIsoCode: e.codepaysetrangeretablissement ?? "FR",
  };
}

  private mapEtablissement(e: any): Etablissement {
    const addressFields = this.extractAddressFields(e);
    const simpleLabel =
      e.enseigne1etablissement ??
      e.denominationusuelleetablissement ??
      e.raisonsociale ?? "";

    return {
      siren: e.siren,

      label: `${simpleLabel} (${e.siret})`,
      simpleLabel,
      highlightLabel: simpleLabel,
      matching: 1,

      activitePrincipaleUniteLegale: e.activiteprincipaleetablissement,
      categorieJuridiqueUniteLegale: e.categoriejuridiqueunitelegale,
      caractereEmployeurUniteLegale: e.caractereemployeuretablissement,
      etatAdministratifUniteLegale: e.etatadministratifetablissement,
      dateCreationUniteLegale: e.datecreationetablissement,
      dateDebut: e.datedebut,
      etablissements: 1,
      conventions: [],

      siret: e.siret,
      etablissementSiege: e.etablissementsiege,
      activitePrincipaleEtablissement: e.activiteprincipaleetablissement,
      address: addressFields.adress,
      city: addressFields.city,
      postalCode: addressFields.postalCode,
      countryIsoCode: addressFields.countryIsoCode,
      codeCommuneEtablissement: e.codecommuneetablissement,
      libelleCommuneEtablissement: e.libellecommuneetablissement,
      categorieEntreprise: e.categorieentreprise,
      etatAdministratifEtablissement: e.etatadministratifetablissement,
    };
  }

  private formatAdresse(o: any): string {
    return [
      o.numerovoie ?? o.numerovoieetablissement,
      o.typevoie ?? o.typevoieetablissement,
      o.libellevoie ?? o.libellevoieetablissement,
      o.codepostal ?? o.codepostaletablissement,
      o.libellecommune ?? o.libellecommuneetablissement,
    ]
      .filter(Boolean)
      .join(" ");
  }
}
