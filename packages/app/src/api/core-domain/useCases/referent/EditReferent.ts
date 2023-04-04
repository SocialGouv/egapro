import { Referent } from "@common/core-domain/domain/Referent";
import { County } from "@common/core-domain/domain/valueObjects/County";
import { ReferentType } from "@common/core-domain/domain/valueObjects/referent/ReferentType";
import { Region } from "@common/core-domain/domain/valueObjects/Region";
import type { EditReferentDTO, ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { Email, UniqueID, Url } from "@common/shared-domain/domain/valueObjects";

import type { IReferentRepo } from "../../repo/IReferentRepo";

export class EditReferent implements UseCase<EditReferentDTO, ReferentDTO> {
  constructor(private readonly referentRepo: IReferentRepo) {}

  public async execute(dto: EditReferentDTO): Promise<ReferentDTO> {
    try {
      const found = await this.referentRepo.getOne(new UniqueID(dto.id));
      if (!found) {
        throw new EditReferentNotFoundError(`No referent found with id ${dto.id}`);
      }

      const type = dto.type ? new ReferentType(dto.type) : found.type;
      if (dto.type && !dto.value) {
        throw new EditReferentValueMissingError("Type cannot be changed without a value.");
      }

      const referent = new Referent(
        {
          name: dto.name || found.name, // || because "" is not allowed
          principal: dto.principal ?? found.principal,
          type,
          value: dto.value
            ? type.getValue() === ReferentType.Enum.EMAIL
              ? new Email(dto.value)
              : new Url(dto.value)
            : found.value,
          county: dto.county ? new County(dto.county) : found.county,
          region: dto.region ? new Region(dto.region) : found.region,
          substitute: {
            email: dto.substitute?.email ? new Email(dto.substitute.email) : found.substitute?.email,
            name: dto.substitute?.name ?? found.substitute?.name, // ?? because "" is allowed
          },
        },
        new UniqueID(dto.id),
      );

      await this.referentRepo.update(referent);
      return referentMap.toDTO(referent);
    } catch (error: unknown) {
      console.error(error);
      throw new EditReferentError("Cannot create referent", error as Error);
    }
  }
}

export class EditReferentError extends AppError {}
export class EditReferentNotFoundError extends EditReferentError {}
export class EditReferentValueMissingError extends EditReferentError {}
