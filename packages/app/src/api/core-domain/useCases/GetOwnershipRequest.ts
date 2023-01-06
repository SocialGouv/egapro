import type { GetOwnershipRequestDTO, GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

export class GetOwnershipRequest implements UseCase<GetOwnershipRequestInputDTO, GetOwnershipRequestDTO> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({
    siren,
    status,
    limit: limitQuery = 10,
    offset: offsetQuery = 0,
    orderBy = "createdAt",
    orderDirection = "desc",
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
        orderDirection,
      });
      return {
        params: {
          siren,
          status,
          limit,
          offset,
          orderDirection,
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
