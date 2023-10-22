import { type DeclarationRaw } from "@api/core-domain/infra/db/DeclarationRaw";
import { type Mapper } from "@common/shared-domain";
import { dateObjectToDateISOString } from "@common/utils/date";
import assert from "assert";

import { DeclarationOpmc } from "../domain/DeclarationOpmc";
import { type DeclarationOpmcDTO } from "../dtos/DeclarationOpmcDTO";
import { declarationMap } from "./declarationMap";

export const declarationOpmcMap: Required<Mapper<DeclarationOpmc, DeclarationOpmcDTO, DeclarationRaw>> = {
  toDomain(raw) {
    const declaration = new DeclarationOpmc({ declaration: declarationMap.toDomain(raw) });

    return declaration.fromJson({
      measuresPublishDate: raw.data.déclaration.publication?.date_publication_mesures,
      objectivesMeasuresModalities: raw.data.déclaration.publication?.modalités_objectifs_mesures,
      objectivesPublishDate: raw.data.déclaration.publication?.date_publication_objectifs,

      objectiveHighRemunerations: raw.data.indicateurs?.hautes_rémunérations
        ? raw.data.indicateurs?.hautes_rémunérations.objectif_de_progression
        : undefined,

      objectiveMaternityLeaves: raw.data.indicateurs?.congés_maternité
        ? raw.data.indicateurs?.congés_maternité.objectif_de_progression
        : undefined,

      objectivePromotions: raw.data.indicateurs?.promotions
        ? raw.data.indicateurs?.promotions.objectif_de_progression
        : undefined,

      objectiveRemunerations: raw.data.indicateurs?.rémunérations
        ? raw.data.indicateurs?.rémunérations.objectif_de_progression
        : undefined,

      objectiveSalaryRaise: raw.data.indicateurs?.augmentations
        ? raw.data.indicateurs?.augmentations.objectif_de_progression
        : undefined,

      objectiveSalaryRaiseAndPromotions: raw.data.indicateurs?.augmentations_et_promotions
        ? raw.data.indicateurs?.augmentations_et_promotions.objectif_de_progression
        : undefined,
    });
  },

  toDTO(obj) {
    const dto: DeclarationOpmcDTO = declarationMap.toDTO(obj.declaration);

    // objectivesPublishDate is the only required field in OP/MC for declaration with index < 85.
    if (obj.objectivesPublishDate) {
      dto.opmc = {
        datePublicationObjectifs: dateObjectToDateISOString(obj.objectivesPublishDate),
        datePublicationMesures: obj.measuresPublishDate && dateObjectToDateISOString(obj.measuresPublishDate),
        modalitesPublicationObjectifsMesures: obj.objectivesMeasuresModalities?.getValue(),
        objectifIndicateurRemunerations: obj.objectiveRemunerations?.getValue(),
        objectifIndicateurAugmentations: obj.objectiveSalaryRaise?.getValue(),
        objectifIndicateurPromotions: obj.objectivePromotions?.getValue(),
        objectifIndicateurAugmentationsPromotions: obj.objectiveSalaryRaiseAndPromotions?.getValue(),
        objectifIndicateurCongesMaternites: obj.objectiveMaternityLeaves?.getValue(),
        objectifIndicateurHautesRemunerations: obj.objectiveHighRemunerations?.getValue(),
      };
    }

    return dto;
  },

  toPersistence(obj) {
    const raw = declarationMap.toPersistence(obj.declaration);

    if (obj.objectivesPublishDate) {
      raw.data.déclaration.publication = {
        ...raw.data.déclaration.publication,
        date_publication_objectifs: dateObjectToDateISOString(obj.objectivesPublishDate),
        ...(obj.measuresPublishDate && {
          date_publication_mesures: dateObjectToDateISOString(obj.measuresPublishDate),
        }),
        ...(obj.objectivesMeasuresModalities && {
          modalités_objectifs_mesures: obj.objectivesMeasuresModalities?.getValue(),
        }),
      };
    }

    if (obj.objectiveRemunerations) {
      assert(
        raw.data.indicateurs?.rémunérations,
        "L'indicateur de rémunération doit être défini si un objectif de progression est présent",
      );
      raw.data.indicateurs.rémunérations.objectif_de_progression = obj.objectiveRemunerations?.getValue();
    }
    if (obj.objectiveSalaryRaise) {
      assert(
        raw.data.indicateurs?.augmentations,
        "L'indicateur d'augmentation doit être défini si un objectif de progression est présent",
      );
      raw.data.indicateurs.augmentations.objectif_de_progression = obj.objectiveSalaryRaise?.getValue();
    }
    if (obj.objectivePromotions) {
      assert(
        raw.data.indicateurs?.promotions,
        "L'indicateur de promotion doit être défini si un objectif de progression est présent",
      );
      raw.data.indicateurs.promotions.objectif_de_progression = obj.objectivePromotions?.getValue();
    }
    if (obj.objectiveSalaryRaiseAndPromotions) {
      assert(
        raw.data.indicateurs?.augmentations_et_promotions,
        "L'indicateur d'augmentation et promotion doit être défini si un objectif de progression est présent",
      );
      raw.data.indicateurs.augmentations_et_promotions.objectif_de_progression =
        obj.objectiveSalaryRaiseAndPromotions?.getValue();
    }
    if (obj.objectiveMaternityLeaves) {
      assert(
        raw.data.indicateurs?.congés_maternité,
        "L'indicateur de congés maternité doit être défini si un objectif de progression est présent",
      );
      raw.data.indicateurs.congés_maternité.objectif_de_progression = obj.objectiveMaternityLeaves?.getValue();
    }
    if (obj.objectiveHighRemunerations) {
      assert(
        raw.data.indicateurs?.hautes_rémunérations,
        "L'indicateur de hautes rémunérations doit être défini si un objectif de progression est présent",
      );
      raw.data.indicateurs.hautes_rémunérations.objectif_de_progression = obj.objectiveHighRemunerations?.getValue();
    }

    return raw;
  },
};
