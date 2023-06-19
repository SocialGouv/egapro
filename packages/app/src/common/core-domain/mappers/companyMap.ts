import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { COUNTRIES_COG_TO_ISO } from "@common/dict";
import { AppError, type Mapper } from "@common/shared-domain";

import { Company } from "../domain/declaration/Company";
import { getAdditionalMeta } from "../helpers/entreprise";

export const companyMap: Mapper<Company, Entreprise, Entreprise> = {
  toDomain(raw) {
    const { address, countryCodeCOG, countyCode, postalCode, regionCode } = getAdditionalMeta(raw);
    return Company.fromJson({
      siren: raw.siren,
      address,
      city: raw.firstMatchingEtablissement.libelleCommuneEtablissement,
      countryCode: COUNTRIES_COG_TO_ISO[countryCodeCOG],
      county: countyCode ?? void 0,
      nafCode: raw.activitePrincipaleUniteLegale,
      name: raw.simpleLabel,
      postalCode,
      region: regionCode ?? void 0,
    });
  },

  toDTO() {
    throw new AppError("companyMap.toDTO() should not be called.");
  },
};
