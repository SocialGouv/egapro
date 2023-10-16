import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type UpdateOpMcDTO } from "@common/core-domain/dtos/UpdateOpMcDTO";
import { OPMC_OPEN_DURATION_AFTER_EDIT } from "@common/dict";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { NonEmptyString } from "@common/shared-domain/domain/valueObjects/NonEmptyString";
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
    const declarationAggregate = await this.declarationRepo.getOneDeclarationOpmc([
      new Siren(siren),
      new PositiveNumber(+year),
    ]);

    const declaration = declarationAggregate?.declaration;

    if (!declarationAggregate || !declaration) {
      throw new UpdateDeclarationWithOpMcDeclarationNotFoundError(
        `Declaration not found with siren=${siren} and year=${year}.`,
      );
    }

    const opMcAlreadySet = !!declarationAggregate.objectivesPublishDate;
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

    if (opmc.objectifIndicateurUn) {
      declarationAggregate.objectiveRemunerations = new NonEmptyString(opmc.objectifIndicateurUn);
    }
    if (opmc.objectifIndicateurDeux) {
      declarationAggregate.objectiveSalaryRaise = new NonEmptyString(opmc.objectifIndicateurDeux);
    }
    if (opmc.objectifIndicateurTrois) {
      declarationAggregate.objectivePromotions = new NonEmptyString(opmc.objectifIndicateurTrois);
    }
    if (opmc.objectifIndicateurDeuxTrois) {
      declarationAggregate.objectiveSalaryRaiseAndPromotions = new NonEmptyString(opmc.objectifIndicateurDeuxTrois);
    }
    if (opmc.objectifIndicateurQuatre) {
      declarationAggregate.objectiveMaternityLeaves = new NonEmptyString(opmc.objectifIndicateurQuatre);
    }
    if (opmc.objectifIndicateurCinq) {
      declarationAggregate.objectiveHighRemunerations = new NonEmptyString(opmc.objectifIndicateurCinq);
    }

    if (opmc.datePublicationMesures) declarationAggregate.measuresPublishDate = parseDate(opmc.datePublicationMesures);

    declarationAggregate.objectivesPublishDate = parseDate(opmc.datePublicationObjectifs);

    if (opmc.modalitesPublicationObjectifsMesures) {
      declarationAggregate.objectivesMeasuresModalities = new NonEmptyString(opmc.modalitesPublicationObjectifsMesures);
    }

    // TODO on ne change pas la date de modification pour éviter de pour redéclarer les opmc tous les ans avant la date limite
    // il faudrait ajouter un champs "opMcModifiedAt"
    // declaration.setModifiedAt(now);

    await this.declarationRepo.update(declaration);
  }
}

export class UpdateDeclarationWithOpMcError extends AppError {}
export class UpdateDeclarationWithOpMcDeclarationNotFoundError extends UpdateDeclarationWithOpMcError {}
export class UpdateDeclarationWithOpMcPastTimeError extends UpdateDeclarationWithOpMcError {}
