import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { OwnershipRequestDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";
import { normalizeQueryParam } from "@common/utils/url";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

interface Input {
  limit?: string[] | string;
  offset?: string[] | string;
  siren?: string[] | string;
  status?: string[] | string;
}

export class GetOwnershipRequest implements UseCase<Input, OwnershipRequestDTO[]> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({
    siren: querySiren,
    status: queryStatus,
    limit: queryLimit,
    offset: queryOffset,
  }: Input): Promise<OwnershipRequestDTO[]> {
    const siren = normalizeQueryParam(querySiren);
    let status: OwnershipRequestStatus | undefined;

    if (Object.values(OwnershipRequestStatus.Enum).includes(normalizeQueryParam(queryStatus) as Any)) {
      status = new OwnershipRequestStatus(normalizeQueryParam(queryStatus));
    }

    const limit = !isNaN(Number(queryLimit)) ? Number(queryLimit) : 10;
    const offset = !isNaN(Number(queryOffset)) ? Number(queryOffset) : 0;

    try {
      const ownershipRequests = await this.ownershipRequestRepo.search({ siren, status, limit, offset });
      return ownershipRequests.map(ownershipRequestMap.toDTO);
    } catch (error: unknown) {
      throw new GetOwnershipRequestError("Cannot create a ownership request", error as Error);
    }
  }
}

export class GetOwnershipRequestError extends AppError {}
