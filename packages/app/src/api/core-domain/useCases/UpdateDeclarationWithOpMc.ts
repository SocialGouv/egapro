import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { UpdateOpMcDTO } from "@common/core-domain/dtos/UpdateOpMcDTO";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { parseDate } from "@common/utils/date";

import type { IDeclarationRepo } from "../repo/IDeclarationRepo";

type Input = {
  opmc: UpdateOpMcDTO;
  siren: string;
  year: string;
};
export class UpdateDeclarationWithOpMc implements UseCase<Input, void> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ opmc, siren, year }: Input): Promise<void> {
    const declaration = await this.declarationRepo.getOne([new Siren(siren), new PositiveNumber(+year)]);

    if (!declaration) {
      throw new UpdateDeclarationWithOpMcDeclarationNotFoundError(
        `Declaration not found with siren=${siren} and year=${year}.`,
      );
    }

    declaration.data?.indicators?.remunerations?.setProgressObjective(opmc.objectifIndicateurUn);
    declaration.data?.indicators?.salaryRaises?.setProgressObjective(opmc.objectifIndicateurDeux);
    declaration.data?.indicators?.promotions?.setProgressObjective(opmc.objectifIndicateurTrois);
    declaration.data?.indicators?.salaryRaisesAndPromotions?.setProgressObjective(opmc.objectifIndicateurDeuxTrois);
    declaration.data?.indicators?.maternityLeaves?.setProgressObjective(opmc.objectifIndicateurQuatre);
    declaration.data?.indicators?.highRemunerations?.setProgressObjective(opmc.objectifIndicateurCinq);

    declaration.data?.declaration.publication?.setMeasuresPublishDate(parseDate(opmc.datePublicationMesures));
    declaration.data?.declaration.publication?.setObjectivesPublishDate(parseDate(opmc.datePublicationObjectifs));
    declaration.data?.declaration.publication?.setObjectivesMeasuresModalities(
      opmc.modalitesPublicationObjectifsMesures,
    );
    declaration.data?.declaration.publication?.setUrl(opmc.lienPublication);

    declaration.setModifiedAt(new Date());

    await this.declarationRepo.update(declaration);
  }
}

export class UpdateDeclarationWithOpMcError extends AppError {}
export class UpdateDeclarationWithOpMcDeclarationNotFoundError extends UpdateDeclarationWithOpMcError {}
