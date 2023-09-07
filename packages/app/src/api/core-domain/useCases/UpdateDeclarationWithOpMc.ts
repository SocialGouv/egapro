import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type UpdateOpMcDTO } from "@common/core-domain/dtos/UpdateOpMcDTO";
import { OPMC_OPEN_DURATION_AFTER_EDIT } from "@common/dict";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { isDateBeforeDuration, parseDate } from "@common/utils/date";

import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

type Input = {
  opmc: UpdateOpMcDTO;
  siren: string;
  year: string;
};
export class UpdateDeclarationWithOpMc implements UseCase<Input, void> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ opmc, siren, year }: Input): Promise<void> {
    const declaration = await this.declarationRepo.getOne([new Siren(siren), new PositiveNumber(+year)]);

    if (!declaration?.data) {
      throw new UpdateDeclarationWithOpMcDeclarationNotFoundError(
        `Declaration not found with siren=${siren} and year=${year}.`,
      );
    }

    const opMcAlreadySet = !!declaration.data.declaration.publication?.objectivesPublishDate;
    const now = new Date();
    const opMcStillEditable = isDateBeforeDuration(
      declaration.modifiedAt,
      { years: OPMC_OPEN_DURATION_AFTER_EDIT },
      now,
    );
    if (opMcAlreadySet) {
      if (!opMcStillEditable) {
        throw new UpdateDeclarationWithOpMcPastTimeError(`OpMc cannot be set anymore. Time is passed.`);
      }
    }

    declaration.data?.indicators?.remunerations?.setProgressObjective(opmc.objectifIndicateurUn);
    declaration.data?.indicators?.salaryRaises?.setProgressObjective(opmc.objectifIndicateurDeux);
    declaration.data?.indicators?.promotions?.setProgressObjective(opmc.objectifIndicateurTrois);
    declaration.data?.indicators?.salaryRaisesAndPromotions?.setProgressObjective(opmc.objectifIndicateurDeuxTrois);
    declaration.data?.indicators?.maternityLeaves?.setProgressObjective(opmc.objectifIndicateurQuatre);
    declaration.data?.indicators?.highRemunerations?.setProgressObjective(opmc.objectifIndicateurCinq);

    if (opmc.datePublicationMesures)
      declaration.data?.declaration.publication?.setMeasuresPublishDate(parseDate(opmc.datePublicationMesures));
    declaration.data?.declaration.publication?.setObjectivesPublishDate(parseDate(opmc.datePublicationObjectifs));
    declaration.data?.declaration.publication?.setObjectivesMeasuresModalities(
      opmc.modalitesPublicationObjectifsMesures,
    );

    // TODO on ne change pas la date de modification pour éviter de pour redéclarer les opmc tous les ans avant la date limite
    // il faudrait ajouter un champs "opMcModifiedAt"
    // declaration.setModifiedAt(now);

    await this.declarationRepo.update(declaration);
  }
}

export class UpdateDeclarationWithOpMcError extends AppError {}
export class UpdateDeclarationWithOpMcDeclarationNotFoundError extends UpdateDeclarationWithOpMcError {}
export class UpdateDeclarationWithOpMcPastTimeError extends UpdateDeclarationWithOpMcError {}
