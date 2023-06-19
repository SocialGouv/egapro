import { type RepresentationEquilibreeSearchResultRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { EntityMap } from "@common/shared-domain/domain/EntityMap";

import { Company } from "../domain/declaration/Company";
import { BalancedRepresentation } from "../domain/declaration/indicators/BalancedRepresentation";
import { RepresentationEquilibreeSearchResult } from "../domain/RepresentationEquilibreeSearchResult";
import { RepEqIndicatorsYear } from "../domain/valueObjects/declaration/declarationInfo/RepEqIndicatorsYear";
import { type PublicCompanyDTO } from "../dtos/DeclarationDTO";
import { type SearchRepresentationEquilibreeResultDTO } from "../dtos/SearchRepresentationEquilibreeDTO";

export const representationEquilibreeSearchResultMap: Mapper<
  RepresentationEquilibreeSearchResult,
  SearchRepresentationEquilibreeResultDTO,
  RepresentationEquilibreeSearchResultRaw
> = {
  toDomain(raw) {
    return new RepresentationEquilibreeSearchResult({
      results: new EntityMap(
        Object.entries(raw.results).map(([key, value]) => [
          new RepEqIndicatorsYear(+key),
          BalancedRepresentation.fromJson({
            executiveMenPercent: value.executiveMenPercent ?? void 0,
            executiveWomenPercent: value.executiveWomenPercent ?? void 0,
            memberMenPercent: value.memberMenPercent ?? void 0,
            memberWomenPercent: value.memberWomenPercent ?? void 0,
            notComputableReasonExecutives: value.notComputableReasonExecutives ?? void 0,
            notComputableReasonMembers: value.notComputableReasonMembers ?? void 0,
          }),
        ]),
      ),
      company: Company.fromJson({
        address: raw.company.adresse,
        city: raw.company.commune,
        countryCode: raw.company.code_pays,
        county: raw.company.département,
        name: raw.company.raison_sociale,
        postalCode: raw.company.code_postal,
        region: raw.company.région,
        siren: raw.company.siren,
        nafCode: raw.company.code_naf,
      }),
    });
  },

  toDTO(obj) {
    const company = representationEquilibreePublicDataToDTO(obj.company);
    return {
      company,
      results: [...obj.results].reduce(
        (acc, [year, result]) => ({
          ...acc,
          [year.getValue()]: {
            executiveMenPercent: result.executiveMenPercent?.getValue() ?? null,
            executiveWomenPercent: result.executiveWomenPercent?.getValue() ?? null,
            memberMenPercent: result.memberMenPercent?.getValue() ?? null,
            memberWomenPercent: result.memberWomenPercent?.getValue() ?? null,
            notComputableReasonExecutives: result.notComputableReasonExecutives?.getValue() ?? null,
            notComputableReasonMembers: result.notComputableReasonMembers?.getValue() ?? null,
          },
        }),
        {} as SearchRepresentationEquilibreeResultDTO["results"],
      ),
    };
  },
};

function representationEquilibreePublicDataToDTO(company: Company): PublicCompanyDTO {
  return {
    /* eslint-disable @typescript-eslint/no-non-null-assertion -- we are sure */
    countryIsoCode: company.countryCode?.getValue(),
    nafCode: company.nafCode!.getValue(),
    countyCode: company.county?.getValue(),
    name: company.name!,
    regionCode: company.region?.getValue(),
    siren: company.siren.getValue(),
  };
}
