import { type DeclarationSearchResultRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { EntityMap } from "@common/shared-domain/domain/EntityMap";

import { DeclarationData } from "../domain/DeclarationData";
import { DeclarationScoreSynthesis } from "../domain/DeclarationScoreSynthesis";
import { DeclarationSearchResult } from "../domain/DeclarationSearchResult";
import { DeclarationIndicatorsYear } from "../domain/valueObjects/declaration/declarationInfo/DeclarationIndicatorsYear";
import { Siren } from "../domain/valueObjects/Siren";
import { type PublicCompanyDTO } from "../dtos/DeclarationDTO";
import { type SearchDeclarationResultDTO } from "../dtos/SearchDeclarationDTO";

export const declarationSearchResultMap: Mapper<
  DeclarationSearchResult,
  SearchDeclarationResultDTO,
  DeclarationSearchResultRaw
> = {
  toDomain(raw) {
    return new DeclarationSearchResult({
      name: raw.name,
      siren: new Siren(raw.siren),
      results: new EntityMap(
        Object.entries(raw.results).map(([key, value]) => [
          new DeclarationIndicatorsYear(+key),
          DeclarationScoreSynthesis.fromJson({
            highRemunerationsScore: value.highRemunerationsScore ?? void 0,
            index: value.index ?? void 0,
            maternityLeavesScore: value.maternityLeavesScore ?? void 0,
            notComputableReasonMaternityLeaves: value.notComputableReasonMaternityLeaves ?? void 0,
            notComputableReasonPromotions: value.notComputableReasonPromotions ?? void 0,
            notComputableReasonRemunerations: value.notComputableReasonRemunerations ?? void 0,
            notComputableReasonSalaryRaises: value.notComputableReasonSalaryRaises ?? void 0,
            notComputableReasonSalaryRaisesAndPromotions: value.notComputableReasonSalaryRaisesAndPromotions ?? void 0,
            promotionsScore: value.promotionsScore ?? void 0,
            remunerationsScore: value.remunerationsScore ?? void 0,
            salaryRaisesAndPromotionsScore: value.salaryRaisesAndPromotionsScore ?? void 0,
            salaryRaisesScore: value.salaryRaisesScore ?? void 0,
          }),
        ]),
      ),
      data: new EntityMap(
        Object.entries(raw.data).map(([key, value]) => [
          new DeclarationIndicatorsYear(+key),
          DeclarationData.fromJson({
            id: value.id,
            company: {
              address: value.entreprise.adresse,
              city: value.entreprise.commune,
              countryCode: value.entreprise.code_pays,
              county: value.entreprise.département,
              hasRecoveryPlan: !!value.entreprise.plan_relance,
              name: value.entreprise.raison_sociale,
              postalCode: value.entreprise.code_postal,
              region: value.entreprise.région,
              siren: value.entreprise.siren,
              ues: value.entreprise.ues
                ? {
                    companies:
                      value.entreprise.ues.entreprises?.map(entreprise => ({
                        name: entreprise.raison_sociale,
                        siren: entreprise.siren,
                      })) ?? [],
                    name: value.entreprise.ues.nom,
                  }
                : void 0,
              workforce: {
                range: value.entreprise.effectif?.tranche,
                total: value.entreprise.effectif?.total,
              },
              nafCode: value.entreprise.code_naf,
            },
            declarant: {
              email: value.déclarant.email,
              firstname: value.déclarant.prénom,
              lastname: value.déclarant.nom,
              phone: value.déclarant.téléphone,
            },
            declaration: {
              computablePoints: value.déclaration.points_calculables,
              correctiveMeasures: value.déclaration.mesures_correctives,
              date: value.déclaration.date,
              draft: !!value.déclaration.brouillon,
              endReferencePeriod: value.déclaration.fin_période_référence,
              indicatorsYear: value.déclaration.année_indicateurs,
              points: value.déclaration.points,
              publication: value.déclaration.publication
                ? {
                    date: value.déclaration.publication.date,
                    modalities: value.déclaration.publication.modalités,
                    url: value.déclaration.publication.url,
                    measuresPublishDate: value.déclaration.publication.date_publication_mesures,
                    objectivesMeasuresModalities: value.déclaration.publication.modalités_objectifs_mesures,
                    objectivesPublishDate: value.déclaration.publication.date_publication_objectifs,
                  }
                : void 0,
              sufficientPeriod: !!value.déclaration.période_suffisante,
              index: value.déclaration.index,
            },
          }),
        ]),
      ),
    });
  },

  toDTO(obj) {
    const company = [...obj.data].reduce(
      (acc, [year, data]) => ({
        ...acc,
        [year.getValue()]: reprensentationEquilibreePublicDataToDTO(data),
      }),
      {} as SearchDeclarationResultDTO["company"],
    );
    return {
      name: obj.name,
      siren: obj.siren.getValue(),
      company,
      results: [...obj.results].reduce(
        (acc, [year, result]) => ({
          ...acc,
          [year.getValue()]: {
            highRemunerationsScore: result.highRemunerationsScore?.getValue() ?? null,
            index: result.index?.getValue() ?? null,
            maternityLeavesScore: result.maternityLeavesScore?.getValue() ?? null,
            notComputableReasonMaternityLeaves: result.notComputableReasonMaternityLeaves?.getValue() ?? null,
            notComputableReasonPromotions: result.notComputableReasonPromotions?.getValue() ?? null,
            notComputableReasonRemunerations: result.notComputableReasonRemunerations?.getValue() ?? null,
            notComputableReasonSalaryRaises: result.notComputableReasonSalaryRaises?.getValue() ?? null,
            notComputableReasonSalaryRaisesAndPromotions:
              result.notComputableReasonSalaryRaisesAndPromotions?.getValue() ?? null,
            promotionsScore: result.promotionsScore?.getValue() ?? null,
            remunerationsScore: result.remunerationsScore?.getValue() ?? null,
            salaryRaisesAndPromotionsScore: result.salaryRaisesAndPromotionsScore?.getValue() ?? null,
            salaryRaisesScore: result.salaryRaisesScore?.getValue() ?? null,
          },
        }),
        {} as SearchDeclarationResultDTO["results"],
      ),
    };
  },
};

function reprensentationEquilibreePublicDataToDTO(data: DeclarationData): PublicCompanyDTO {
  return {
    /* eslint-disable @typescript-eslint/no-non-null-assertion -- we are sure */
    nafCode: data.company.nafCode!.getValue(),
    countyCode: data.company.county!.getValue(),
    ...(data.company.workforce?.total || data.company.workforce?.range
      ? {
          workforce: {
            total: data.company.workforce?.total?.getValue(),
            range: data.company.workforce?.range?.getValue(),
          },
        }
      : {}),
    name: data.company.name!,
    regionCode: data.company.region!.getValue(),
    siren: data.company.siren.getValue(),
    ...(data.company.ues
      ? {
          ues: {
            companies: data.company.ues.companies.map(company => ({
              name: company.name,
              siren: company.siren.getValue(),
            })),
            name: data.company.ues.name!,
          },
        }
      : {}),
  };
}
