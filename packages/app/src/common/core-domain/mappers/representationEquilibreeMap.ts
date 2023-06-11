import { type RepresentationEquilibreeRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { dateObjectToDateISOString } from "@common/utils/date";

import { RepresentationEquilibree } from "../domain/RepresentationEquilibree";
import { type RepresentationEquilibreeDTO } from "../dtos/RepresentationEquilibreeDTO";

export const representationEquilibreeMap: Required<
  Mapper<RepresentationEquilibree, RepresentationEquilibreeDTO, RepresentationEquilibreeRaw>
> = {
  toDomain(raw) {
    return RepresentationEquilibree.fromJson({
      declaredAt: raw.declared_at,
      modifiedAt: raw.modified_at,
      siren: raw.siren,
      year: raw.year,
      company: {
        address: raw.data.entreprise.adresse,
        city: raw.data.entreprise.commune,
        countryCode: raw.data.entreprise.code_pays,
        county: raw.data.entreprise.département,
        name: raw.data.entreprise.raison_sociale,
        postalCode: raw.data.entreprise.code_postal,
        region: raw.data.entreprise.région,
        siren: raw.data.entreprise.siren,
        nafCode: raw.data.entreprise.code_naf,
      },
      declarant: {
        email: raw.data.déclarant.email,
        firstname: raw.data.déclarant.prénom,
        lastname: raw.data.déclarant.nom,
        phone: raw.data.déclarant.téléphone,
      },
      endReferencePeriod: raw.data.déclaration.fin_période_référence,
      indicator: {
        executiveMenPercent: raw.data.indicateurs.représentation_équilibrée.pourcentage_hommes_cadres,
        executiveWomenPercent: raw.data.indicateurs.représentation_équilibrée.pourcentage_femmes_cadres,
        memberMenPercent: raw.data.indicateurs.représentation_équilibrée.pourcentage_hommes_membres,
        memberWomenPercent: raw.data.indicateurs.représentation_équilibrée.pourcentage_femmes_membres,
        notComputableReasonExecutives: raw.data.indicateurs.représentation_équilibrée.motif_non_calculabilité_cadres,
        notComputableReasonMembers: raw.data.indicateurs.représentation_équilibrée.motif_non_calculabilité_membres,
      },
      publication: raw.data.déclaration.publication
        ? {
            date: raw.data.déclaration.publication.date,
            ...(raw.data.déclaration.publication.modalités
              ? {
                  modalities: raw.data.déclaration.publication.modalités,
                }
              : {
                  url: raw.data.déclaration.publication.url,
                }),
          }
        : void 0,
      source: raw.data.source,
    });
  },

  toDTO(obj) {
    return reprensentationEquilibreeDataToDTO(obj);
  },

  toPersistence(obj) {
    const data = reprensentationEquilibreeDataToDTO(obj);
    return {
      declared_at: obj.declaredAt,
      ft: "", // TODO
      modified_at: obj.modifiedAt,
      siren: obj.siren.getValue(),
      year: obj.year.getValue(),
      data: {
        déclarant: {
          email: data.email,
          nom: data.lastname,
          prénom: data.firstname,
          téléphone: data.phoneNumber,
        },
        déclaration: {
          année_indicateurs: data.year,
          fin_période_référence: data.endOfPeriod,
          date: data.date,
          ...(data.publishDate
            ? {
                publication: {
                  date: data.publishDate,
                  ...("publishUrl" in data ? { url: data.publishUrl } : { modalités: data.publishModalities }),
                },
              }
            : {}),
        },
        entreprise: {
          siren: data.siren,
          adresse: obj.company.address,
          code_naf: obj.company.nafCode?.getValue(),
          code_pays: obj.company.countryCode?.getValue(),
          code_postal: obj.company.postalCode?.getValue(),
          commune: obj.company.city,
          département: obj.company.county?.getValue(),
          raison_sociale: obj.company.name,
          région: obj.company.region?.getValue(),
        },
        indicateurs: {
          représentation_équilibrée: {
            ...("notComputableReasonExecutives" in data
              ? {
                  motif_non_calculabilité_cadres: data.notComputableReasonExecutives,
                }
              : {
                  pourcentage_femmes_cadres: data.executiveWomenPercent,
                  pourcentage_hommes_cadres: data.executiveMenPercent,
                }),
            ...("notComputableReasonMembers" in data
              ? {
                  motif_non_calculabilité_membres: data.notComputableReasonMembers,
                }
              : {
                  pourcentage_femmes_membres: data.memberWomenPercent,
                  pourcentage_hommes_membres: data.memberMenPercent,
                }),
          },
        },
      },
    };
  },
};

function reprensentationEquilibreeDataToDTO(data: RepresentationEquilibree): RepresentationEquilibreeDTO {
  return {
    date: dateObjectToDateISOString(data.declaredAt),
    email: data.declarant.email.getValue(),
    endOfPeriod: dateObjectToDateISOString(data.endReferencePeriod),
    firstname: data.declarant.firstname,
    lastname: data.declarant.lastname,
    phoneNumber: data.declarant.phone,
    siren: data.siren.getValue(),
    year: data.year.getValue(),
    ...(data.indicator.notComputableReasonExecutives
      ? {
          notComputableReasonExecutives: data.indicator.notComputableReasonExecutives.getValue(),
        }
      : {
          executiveMenPercent: data.indicator.executiveMenPercent!.getValue()!,
          executiveWomenPercent: data.indicator.executiveWomenPercent!.getValue()!,
        }),
    ...(data.indicator.notComputableReasonMembers
      ? {
          notComputableReasonMembers: data.indicator.notComputableReasonMembers.getValue(),
        }
      : {
          memberMenPercent: data.indicator.memberMenPercent!.getValue()!,
          memberWomenPercent: data.indicator.memberWomenPercent!.getValue()!,
        }),
    ...(data.publication
      ? {
          publishDate: dateObjectToDateISOString(data.publication.date),
          ...(data.publication.url
            ? {
                publishUrl: data.publication.url,
              }
            : {
                publishModalities: data.publication.modalities!,
              }),
        }
      : {}),
  } as RepresentationEquilibreeDTO;
}
