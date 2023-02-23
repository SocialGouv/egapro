import type {
  GetOwnershipRequestDbOrderBy,
  GetOwnershipRequestDTO,
  GetOwnershipRequestInputDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import _ from "lodash";

import type { IEntrepriseService } from "../infra/services/IEntrepriseService";
import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

export class GetOwnershipRequest implements UseCase<GetOwnershipRequestInputDTO, GetOwnershipRequestDTO> {
  constructor(
    private readonly ownershipRequestRepo: IOwnershipRequestRepo,
    private readonly entrepriseService: IEntrepriseService,
  ) {}

  public async execute({
    query,
    status,
    limit: limitQuery = 10,
    offset: offsetQuery = 0,
    orderBy = "createdAt",
    orderDirection = "desc",
  }: GetOwnershipRequestInputDTO): Promise<GetOwnershipRequestDTO> {
    const limit = limitQuery > 0 && limitQuery <= 100 ? limitQuery : 10;
    const offset = Math.max(offsetQuery, 0);

    const totalCount = await this.ownershipRequestRepo.countSearch({
      query,
      status,
    });

    const notDbOrderByKeys: Array<typeof orderBy> = ["name"];

    const originalOrderBy = orderBy;
    if (notDbOrderByKeys.includes(orderBy)) {
      orderBy = "createdAt";
    }

    try {
      const ownershipRequests = await this.ownershipRequestRepo.search({
        query,
        status,
        limit,
        offset,
        orderBy: orderBy as GetOwnershipRequestDbOrderBy,
        orderDirection,
      });

      let data = await Promise.all(
        ownershipRequests.map(async domain => {
          const req = ownershipRequestMap.toDTO(domain);

          if (domain.siren) req.name = (await this.entrepriseService.siren(domain.siren)).simpleLabel;
          return req;
        }),
      );

      if (notDbOrderByKeys.includes(originalOrderBy)) {
        data = _.sortBy(data, originalOrderBy);
        if (orderDirection === "desc") {
          data = data.reverse();
        }
      }

      return {
        params: {
          query,
          status,
          limit,
          offset,
          orderDirection,
          orderBy,
        },
        totalCount,
        data,
      };
    } catch (error: unknown) {
      console.error(error);
      throw new GetOwnershipRequestError("Cannot get ownership requests", error as Error);
    }
  }
}

export class GetOwnershipRequestError extends AppError {}
