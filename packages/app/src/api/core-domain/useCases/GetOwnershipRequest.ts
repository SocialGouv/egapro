import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestDTO, GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

export class GetOwnershipRequest implements UseCase<GetOwnershipRequestInputDTO, GetOwnershipRequestDTO> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({
    siren,
    status = OwnershipRequestStatus.Enum.TO_PROCESS,
    limit: limitQuery = 10,
    offset: offsetQuery = 0,
    orderBy = "createdAt",
    order = "desc",
  }: GetOwnershipRequestInputDTO): Promise<GetOwnershipRequestDTO> {
    const limit = limitQuery > 0 && limitQuery <= 100 ? limitQuery : 10;
    const offset = Math.max(offsetQuery, 0);

    const totalCount = await this.ownershipRequestRepo.countSearch({
      siren,
      status,
    });

    try {
      const ownershipRequests = await this.ownershipRequestRepo.search({
        siren,
        status,
        limit,
        offset,
        orderBy,
        order,
      });
      return {
        params: {
          siren,
          status,
          limit,
          offset,
          order,
          orderBy,
        },
        totalCount,
        data: ownershipRequests.map(ownershipRequestMap.toDTO),
      };
    } catch (error: unknown) {
      console.error(error);
      throw new GetOwnershipRequestError("Cannot get ownership requests", error as Error);
    }
  }
}

export class GetOwnershipRequestError extends AppError {}
