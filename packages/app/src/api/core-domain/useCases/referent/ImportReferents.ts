import { Referent } from "@common/core-domain/domain/Referent";
import { County } from "@common/core-domain/domain/valueObjects/County";
import { ReferentType } from "@common/core-domain/domain/valueObjects/referent/ReferentType";
import { Region } from "@common/core-domain/domain/valueObjects/Region";
import type { CreateReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { Email, Url } from "@common/shared-domain/domain/valueObjects";

import type { IReferentRepo } from "../../repo/IReferentRepo";

export class ImportReferents implements UseCase<CreateReferentDTO[], void> {
  constructor(private readonly referentRepo: IReferentRepo) {}

  public async execute(dtos: CreateReferentDTO[]): Promise<void> {
    try {
      const referents = dtos.map(
        dto =>
          new Referent({
            name: dto.name,
            principal: dto.principal,
            type: new ReferentType(dto.type),
            value: dto.type === "email" ? new Email(dto.value) : new Url(dto.value),
            county: dto.county ? new County(dto.county) : void 0,
            region: new Region(dto.region),
            substitute: {
              email: dto.substitute?.email ? new Email(dto.substitute.email) : void 0,
              name: dto.substitute?.name,
            },
          }),
      );
      await this.referentRepo.truncate();
      await this.referentRepo.saveBulk(...referents);
    } catch (error: unknown) {
      console.error(error);
      throw new ImportReferentsError("Cannot import referents", error as Error);
    }
  }
}

export class ImportReferentsError extends AppError {}
