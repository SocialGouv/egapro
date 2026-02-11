import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { COUNTRIES_COG_TO_ISO } from "@common/dict";
import { AppError, type Mapper } from "@common/shared-domain";

import { Company } from "../domain/declaration/Company";
import { getAdditionalMeta } from "../helpers/entreprise";

export const companyMap: Mapper<Company, Entreprise, Entreprise> = {
  toDomain(raw) {
    const { address, countryCodeCOG, countyCode, postalCode, regionCode } = getAdditionalMeta(raw);
    const companyJson: Record<string, unknown> = {
      siren: raw.siren,
      address,
      city: raw.firstMatchingEtablissement.libelleCommuneEtablissement,
      countryCode: COUNTRIES_COG_TO_ISO[countryCodeCOG],
      county: countyCode ?? void 0,
      name: raw.simpleLabel,
      postalCode,
      region: regionCode ?? void 0,
    };
    if (raw.activitePrincipaleUniteLegale) {
      companyJson.nafCode = raw.activitePrincipaleUniteLegale;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Record<string, unknown> is built dynamically
    return Company.fromJson(companyJson as any);
  },

  toDTO() {
    throw new AppError("companyMap.toDTO() should not be called.");
  },
};
