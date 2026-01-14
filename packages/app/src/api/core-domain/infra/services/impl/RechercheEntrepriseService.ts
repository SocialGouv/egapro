import { stringify } from "querystring";
import { StatusCodes } from "http-status-codes";

import { Organization } from "@api/core-domain/infra/auth/ProConnectProvider";
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
      });

      const res = await fetch(url.toString());

      if (!res.ok) {
        throw new EntrepriseServiceError(
          `Erreur lors de la recherche d'entreprises (${res.status})`,
        );
      }

      const data = await res.json();

      return (data.content ?? []).map((u: any) =>
        this.mapUniteLegaleToEntreprise(u),
      );
    } catch (error) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError(
        "Erreur inconnue lors de la recherche d'entreprises",
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
        siren: siren.toString(),
        page: 0,
      });

      const res = await fetch(url.toString());

      if (res.status === StatusCodes.NOT_FOUND) {
        throw new EntrepriseServiceNotFoundError(
          `Entreprise non trouvée pour le SIREN ${siren.toString()}`,
        );
      }

      if (!res.ok) {
        throw new EntrepriseServiceError(
          `Erreur lors de la récupération de l'entreprise ${siren.toString()}`,
        );
      }

      const data = await res.json();

      if (!data.content?.length) {
        throw new EntrepriseServiceNotFoundError(
          `Entreprise non trouvée pour le SIREN ${siren.toString()}`,
        );
      }

      return this.mapUniteLegaleToEntreprise(data.content[0]);
    } catch (error) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError(
        `Erreur inconnue lors de la recherche par SIREN ${siren.toString()}`,
        error as Error,
      );
    }
  }

  /* =====================================================
   * 🏢 Recherche par SIRET
   * ===================================================== */
  async siret(siret: Siret): Promise<Etablissement> {
    try {
      const url = new URL(`${BASE_URL}/etablissement/findbysiret`);
      url.search = stringify({
        siret: siret.toString(),
        page: 0,
      });

      const res = await fetch(url.toString());

      if (res.status === StatusCodes.NOT_FOUND) {
        throw new EntrepriseServiceNotFoundError(
          `Établissement non trouvé pour le SIRET ${siret.toString()}`,
        );
      }

      if (!res.ok) {
        throw new EntrepriseServiceError(
          `Erreur lors de la récupération de l'établissement ${siret.toString()}`,
        );
      }

      const data = await res.json();

      if (!data.content?.length) {
        throw new EntrepriseServiceNotFoundError(
          `Établissement non trouvé pour le SIRET ${siret.toString()}`,
        );
      }

      return this.mapEtablissement(data.content[0]);
    } catch (error) {
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
    const shortEtablissement: ShortEtablissement = {
      siret: `${u.siren}${u.nicsiegeunitelegale}`,
      etablissementSiege: true,
      activitePrincipaleEtablissement: u.activiteprincipaleunitelegale,
      address: this.formatAdresse(u),
      codeCommuneEtablissement: u.codecommune ?? "",
      libelleCommuneEtablissement: u.libellecommune,
      codePostalEtablissement: u.codepostal,
      categorieEntreprise: u.categorieentreprise,
    };

    const simpleLabel =
      u.denominationunitelegale ?? u.nomunitelegale ?? u.siren;

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

      allMatchingEtablissements: [shortEtablissement],
      firstMatchingEtablissement: shortEtablissement,
    };
  }

  private mapEtablissement(e: any): Etablissement {
    const simpleLabel =
      e.enseigne1etablissement ??
      e.denominationusuelleetablissement ??
      e.siret;

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
      address: this.formatAdresse(e),
      codeCommuneEtablissement: e.codecommuneetablissement,
      libelleCommuneEtablissement: e.libellecommuneetablissement,
      codePostalEtablissement: e.codepostaletablissement,
      categorieEntreprise: e.categorieentreprise,

      etatAdministratifEtablissement: e.etatadministratifetablissement,
    };
  }

  /* =====================================================
   * 🧩 Helpers
   * ===================================================== */

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
   /* =====================================================
    * 🏢 Recherche par SIRET pour Organization
    * ===================================================== */
   async getOrganizationBySiret(siret: string): Promise<Organization | null> {
     try {
       const url = new URL(`${BASE_URL}/etablissement/findbysiret`);
       url.search = stringify({
         siret,
         page: 0,
       });

       const res = await fetch(url.toString(), {
         method: "GET",
         headers: { Accept: "application/json" },
         cache: "no-store",
       });

       if (!res.ok) {
         return null;
       }

       const data = await res.json() as { content: any[] };
       const etablissement = data.content[0];

       if (!etablissement) {
         return null;
       }

       // Mapper vers Organization
       return {
         id: parseInt(etablissement.siret, 10),
         label: etablissement.raisonsociale || null,
         siren: etablissement.siren,
         siret: etablissement.siret,
         is_collectivite_territoriale: false,
         is_external: false,
         is_service_public: false,
       };
     } catch (error) {
       return null;
     }
   }
}
