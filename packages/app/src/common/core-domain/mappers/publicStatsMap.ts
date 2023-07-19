import { type PublicStatsRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { PublicStats } from "../domain/PublicStats";
import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { type PublicStatsDTO } from "../dtos/PublicStatsDTO";

export const publicStatsMap: Mapper<PublicStats, PublicStatsDTO, PublicStatsRaw> = {
  toDomain(raw) {
    return new PublicStats({
      year: new PositiveNumber(raw.year),
      balancedRepresentation: {
        count: new PositiveNumber(Number(raw["representation_equilibree.count"])),
        countWomen30percentExecutives: {
          gt: new PositiveNumber(Number(raw["representation_equilibree.countWomen30percentExecutives.gt"])),
          lte: new PositiveNumber(Number(raw["representation_equilibree.countWomen30percentExecutives.lte"])),
          nc: new PositiveNumber(Number(raw["representation_equilibree.countWomen30percentExecutives.nc"])),
        },
        countWomen30percentMembers: {
          gt: new PositiveNumber(Number(raw["representation_equilibree.countWomen30percentMembers.gt"])),
          lte: new PositiveNumber(Number(raw["representation_equilibree.countWomen30percentMembers.lte"])),
          nc: new PositiveNumber(Number(raw["representation_equilibree.countWomen30percentMembers.nc"])),
        },
      },
      index: {
        average: new PositiveNumber(Number(raw["index.average"])),
        averageByWorkforceRange: new Map(
          Object.entries(raw["index.averageByWorkforceRange"]).map(([key, value]) => [
            new CompanyWorkforceRange(key.replace(/"/g, "") as CompanyWorkforceRange.Enum),
            new PositiveNumber(value ?? 0),
          ]),
        ),
        count: new PositiveNumber(Number(raw["index.count"])),
        countByWorkforceRange: new Map(
          Object.entries(raw["index.countByWorkforceRange"]).map(([key, value]) => [
            new CompanyWorkforceRange(key.replace(/"/g, "") as CompanyWorkforceRange.Enum),
            new PositiveNumber(value ?? 0),
          ]),
        ),
        lastThreeYearsAverage: new Map(
          Object.entries(raw["index.lastThreeYearsAverage"]).map(([key, value]) => [
            new PositiveNumber(Number(key)),
            new PositiveNumber(Number(value ?? 0)),
          ]),
        ),
      },
    });
  },

  toDTO(obj) {
    const dto: PublicStatsDTO = {
      year: obj.year.getValue(),
      index: {
        average: obj.index.average.getValue(),
        averageByWorkforceRange: Object.fromEntries(
          [...obj.index.averageByWorkforceRange.entries()].map(([key, value]) => [key.getValue(), value.getValue()]),
        ) as Record<CompanyWorkforceRange.Enum, number>,
        count: obj.index.count.getValue(),
        countByWorkforceRange: Object.fromEntries(
          [...obj.index.countByWorkforceRange.entries()].map(([key, value]) => [key.getValue(), value.getValue()]),
        ) as Record<CompanyWorkforceRange.Enum, number>,
        lastThreeYearsAverage: Object.fromEntries(
          [...obj.index.lastThreeYearsAverage.entries()].map(([key, value]) => [key.getValue(), value.getValue()]),
        ),
      },
      balancedRepresentation: {
        count: obj.balancedRepresentation.count.getValue(),
        countWomen30percentExecutives: {
          gt: obj.balancedRepresentation.countWomen30percentExecutives.gt.getValue(),
          lte: obj.balancedRepresentation.countWomen30percentExecutives.lte.getValue(),
          nc: obj.balancedRepresentation.countWomen30percentExecutives.nc.getValue(),
        },
        countWomen30percentMembers: {
          gt: obj.balancedRepresentation.countWomen30percentMembers.gt.getValue(),
          lte: obj.balancedRepresentation.countWomen30percentMembers.lte.getValue(),
          nc: obj.balancedRepresentation.countWomen30percentMembers.nc.getValue(),
        },
      },
    };

    return dto;
  },
};
