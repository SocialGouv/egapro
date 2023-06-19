import { type RepresentationEquilibreeSearchResultRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { EntityMap } from "@common/shared-domain/domain/EntityMap";

import { BalancedRepresentation } from "../domain/declaration/indicators/BalancedRepresentation";
import { RepresentationEquilibreeData } from "../domain/RepresentationEquilibreeData";
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
      data: RepresentationEquilibreeData.fromJson({
        id: raw.data.id,
        company: {
          address: raw.data.entreprise.adresse,
          city: raw.data.entreprise.commune,
          countryCode: raw.data.entreprise.code_pays,
          county: raw.data.entreprise.département,
          hasRecoveryPlan: !!raw.data.entreprise.plan_relance,
          name: raw.data.entreprise.raison_sociale,
          postalCode: raw.data.entreprise.code_postal,
          region: raw.data.entreprise.région,
          siren: raw.data.entreprise.siren,
          ues: raw.data.entreprise.ues
            ? {
                companies:
                  raw.data.entreprise.ues.entreprises?.map(entreprise => ({
                    name: entreprise.raison_sociale,
                    siren: entreprise.siren,
                  })) ?? [],
                name: raw.data.entreprise.ues.nom,
              }
            : void 0,
          workforce: {
            range: raw.data.entreprise.effectif?.tranche,
            total: raw.data.entreprise.effectif?.total,
          },
          nafCode: raw.data.entreprise.code_naf,
        },
        declarant: {
          email: raw.data.déclarant.email,
          firstname: raw.data.déclarant.prénom,
          lastname: raw.data.déclarant.nom,
          phone: raw.data.déclarant.téléphone,
        },
        declaration: {
          computablePoints: raw.data.déclaration.points_calculables,
          correctiveMeasures: raw.data.déclaration.mesures_correctives,
          date: raw.data.déclaration.date,
          draft: !!raw.data.déclaration.brouillon,
          endReferencePeriod: raw.data.déclaration.fin_période_référence,
          indicatorsYear: raw.data.déclaration.année_indicateurs,
          points: raw.data.déclaration.points,
          publication: raw.data.déclaration.publication
            ? {
                date: raw.data.déclaration.publication.date,
                modalities: raw.data.déclaration.publication.modalités,
                url: raw.data.déclaration.publication.url,
                measuresPublishDate: raw.data.déclaration.publication.date_publication_mesures,
                objectivesMeasuresModalities: raw.data.déclaration.publication.modalités_objectifs_mesures,
                objectivesPublishDate: raw.data.déclaration.publication.date_publication_objectifs,
              }
            : void 0,
          sufficientPeriod: !!raw.data.déclaration.période_suffisante,
          index: raw.data.déclaration.index,
        },
        indicators: {
          balancedRepresentation: raw.data.indicateurs?.représentation_équilibrée
            ? {
                executiveMenPercent: raw.data.indicateurs?.représentation_équilibrée.pourcentage_hommes_cadres,
                executiveWomenPercent: raw.data.indicateurs?.représentation_équilibrée.pourcentage_femmes_cadres,
                memberMenPercent: raw.data.indicateurs?.représentation_équilibrée.pourcentage_hommes_membres,
                memberWomenPercent: raw.data.indicateurs?.représentation_équilibrée.pourcentage_femmes_membres,
                notComputableReasonExecutives:
                  raw.data.indicateurs?.représentation_équilibrée.motif_non_calculabilité_cadres,
                notComputableReasonMembers:
                  raw.data.indicateurs?.représentation_équilibrée.motif_non_calculabilité_membres,
              }
            : void 0,
        },
      }),
    });
  },

  toDTO(obj) {
    const company = reprensentationEquilibreePublicDataToDTO(obj.data);
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

function reprensentationEquilibreePublicDataToDTO(data: RepresentationEquilibreeData): PublicCompanyDTO {
  return {
    /* eslint-disable @typescript-eslint/no-non-null-assertion -- we are sure */
    countryIsoCode: data.company.countryCode?.getValue(),
    nafCode: data.company.nafCode!.getValue(),
    countyCode: data.company.county?.getValue(),
    ...(data.company.workforce?.total || data.company.workforce?.range
      ? {
          workforce: {
            total: data.company.workforce?.total?.getValue(),
            range: data.company.workforce?.range?.getValue(),
          },
        }
      : {}),
    name: data.company.name!,
    regionCode: data.company.region?.getValue(),
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
