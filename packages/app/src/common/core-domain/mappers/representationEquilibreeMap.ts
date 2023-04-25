import type { RepresentationEquilibreeRaw } from "@api/core-domain/infra/db/raw";
import type {
  AnneeIndicateur,
  CodeNaf,
  CodePays,
  Departement,
  Effectif,
  Entreprise as Entreprises,
  Region,
} from "@common/models/generated";
import type { Mapper } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { dateObjectToDateISOString } from "@common/utils/date";
import type { Any } from "@common/utils/types";

import { RepresentationEquilibree } from "../domain/RepresentationEquilibree";
import { RepresentationEquilibreeData } from "../domain/RepresentationEquilibreeData";
import { Siren } from "../domain/valueObjects/Siren";
import type { DeclarationDTO } from "../dtos/DeclarationDTO";

export const representationEquilibreeMap: Required<
  Mapper<RepresentationEquilibree, DeclarationDTO | null, RepresentationEquilibreeRaw>
> = {
  // TODO convert without validation if perf are not good
  toDomain(raw) {
    return new RepresentationEquilibree({
      declaredAt: new Date(raw.declared_at),
      modifiedAt: new Date(raw.modified_at),
      siren: new Siren(raw.siren),
      year: new PositiveNumber(raw.year),
      data: raw.data
        ? RepresentationEquilibreeData.fromJson({
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
          })
        : void 0,
    });
  },

  toDTO(obj) {
    const data = obj.data;
    if (data) {
      return reprensentationEquilibreeDataToDTO(data);
    }

    return null;
  },

  toPersistence(obj) {
    // TODO
    return {
      declared_at: obj.declaredAt,
      ft: "", // TODO
      modified_at: obj.modifiedAt,
      siren: obj.siren.getValue(),
      year: obj.year.getValue(),
      data: obj.data ? reprensentationEquilibreeDataToDTO(obj.data) : void 0,
    };
  },
};

function reprensentationEquilibreeDataToDTO(data: RepresentationEquilibreeData): DeclarationDTO {
  type Entreprise = Entreprises[number];
  type Tranche = NonNullable<Effectif["tranche"]>;

  return {
    déclarant: {
      email: data.declarant.email.getValue(),
      nom: data.declarant.lastname,
      prénom: data.declarant.firstname,
      téléphone: data.declarant.phone,
    },
    déclaration: {
      année_indicateurs: data.declaration.indicatorsYear.getValue() as AnneeIndicateur,
      brouillon: data.declaration.draft,
      date: data.declaration.date ? dateObjectToDateISOString(data.declaration.date) : void 0,
      fin_période_référence: data.declaration.endReferencePeriod
        ? dateObjectToDateISOString(data.declaration.endReferencePeriod)
        : void 0,
      index: data.declaration.index?.getValue(),
      mesures_correctives: data.declaration.correctiveMeasures?.getValue(),
      points: data.declaration.points?.getValue(),
      points_calculables: data.declaration.computablePoints?.getValue(),
      publication: {
        date: data.declaration.publication?.date
          ? dateObjectToDateISOString(data.declaration.publication?.date)
          : void 0,
        date_publication_mesures: data.declaration.publication?.measuresPublishDate
          ? dateObjectToDateISOString(data.declaration.publication?.measuresPublishDate)
          : void 0,
        date_publication_objectifs: data.declaration.publication?.objectivesPublishDate
          ? dateObjectToDateISOString(data.declaration.publication?.objectivesPublishDate)
          : void 0,
        modalités: data.declaration.publication?.modalities,
        modalités_objectifs_mesures: data.declaration.publication?.objectivesMeasuresModalities,
        url: data.declaration.publication?.url,
      },
      période_suffisante: data.declaration.sufficientPeriod,
    },
    entreprise: {
      siren: data.company.siren.getValue(),
      adresse: data.company.address,
      code_naf: data.company.nafCode?.getValue() as CodeNaf,
      code_pays: data.company.countryCode?.getValue() as CodePays,
      code_postal: data.company.postalCode?.getValue(),
      commune: data.company.city,
      département: data.company.county?.getValue() as Departement,
      effectif: {
        total: data.company.workforce?.total?.getValue(),
        tranche: data.company.workforce?.range?.getValue() as Tranche,
      },
      plan_relance: data.company.hasRecoveryPlan,
      raison_sociale: data.company.name,
      région: data.company.region?.getValue() as Region,
      ues: {
        entreprises: data.company.ues?.companies.map<Entreprise>(company => ({
          raison_sociale: company.name,
          siren: company.siren.getValue(),
        })),
        nom: data.company.ues?.name,
      },
    },
    indicateurs: {
      représentation_équilibrée: {
        motif_non_calculabilité_cadres: data.indicators?.balancedRepresentation?.notComputableReasonExecutives as Any,
        motif_non_calculabilité_membres: data.indicators?.balancedRepresentation?.notComputableReasonMembers as Any,
        pourcentage_femmes_cadres: data.indicators?.balancedRepresentation?.executiveWomenPercent?.getValue(),
        pourcentage_femmes_membres: data.indicators?.balancedRepresentation?.memberWomenPercent?.getValue(),
        pourcentage_hommes_cadres: data.indicators?.balancedRepresentation?.executiveMenPercent?.getValue(),
        pourcentage_hommes_membres: data.indicators?.balancedRepresentation?.memberMenPercent?.getValue(),
      },
    },
  };
}
