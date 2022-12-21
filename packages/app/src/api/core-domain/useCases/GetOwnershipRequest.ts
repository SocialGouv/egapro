import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";
import { OWNERSHIP_REQUEST_SORTABLE_COLS } from "../repo/IOwnershipRequestRepo";

interface Input {
  limit?: string;
  offset?: string;
  orderAsc?: string;
  orderBy?: string;
  siren?: string;
  status?: string;
}

export class GetOwnershipRequest implements UseCase<Input, GetOwnershipRequestDTO> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({
    siren,
    status: statusQuery,
    limit: limitQuery,
    offset: offsetQuery,
    orderBy: orderByQuery,
    orderAsc: orderAscQuery,
  }: Input): Promise<GetOwnershipRequestDTO> {
    const warnings = [];

    let status: OwnershipRequestStatus | undefined;

    if (statusQuery && Object.values(OwnershipRequestStatus.Enum).includes(statusQuery as Any)) {
      status = new OwnershipRequestStatus(statusQuery);
    } else {
      warnings.push([
        "status",
        `'${statusQuery}' doesn't match expected values ${Object.values(OwnershipRequestStatus.Enum)
          .map(elt => `'${elt}'`)
          .join(", ")}`,
      ] as const);
    }

    const orderByColumn: keyof typeof OWNERSHIP_REQUEST_SORTABLE_COLS =
      orderByQuery && Object.keys(OWNERSHIP_REQUEST_SORTABLE_COLS).includes(orderByQuery)
        ? (orderByQuery as keyof typeof OWNERSHIP_REQUEST_SORTABLE_COLS)
        : "date";

    if (orderByQuery !== orderByColumn) {
      warnings.push([
        "orderBy",
        `'${orderByQuery}' doesn't match expected values ${Object.keys(OWNERSHIP_REQUEST_SORTABLE_COLS)
          .map(elt => `'${elt}'`)
          .join(", ")}`,
      ] as const);
    }

    const orderAsc = orderAscQuery !== "false";

    const limit =
      !isNaN(Number(limitQuery)) && Number(limitQuery) >= 1 && Number(limitQuery) <= 100 ? Number(limitQuery) : 10;
    const offset = !isNaN(Number(offsetQuery)) ? Number(offsetQuery) : 0;

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
        orderByColumn,
        orderAsc,
      });
      return {
        params: {
          siren,
          status: status?.getValue(),
          limit,
          offset,
          orderAsc,
          orderByColumn,
        },
        totalCount,
        ...(warnings.length && { warnings }),
        data: ownershipRequests.map(ownershipRequestMap.toDTO),
      };
    } catch (error: unknown) {
      console.error(error);
      throw new GetOwnershipRequestError("Cannot create a ownership request", error as Error);
    }
  }
}

export class GetOwnershipRequestError extends AppError {}
