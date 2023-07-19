import { Entity } from "@common/shared-domain";
import { type PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type CompanyWorkforceRange } from "./valueObjects/declaration/CompanyWorkforceRange";

type BRPercentComparison = {
  /** Plus que 30% */
  gt: PositiveNumber;
  /** Moins ou égale à 30% */
  lte: PositiveNumber;
  /** Non calculable */
  nc: PositiveNumber;
};

type BalancedRepresentationStats = {
  count: PositiveNumber;
  countWomen30percentExecutives: BRPercentComparison;
  countWomen30percentMembers: BRPercentComparison;
};

type IndexStats = {
  average: PositiveNumber;
  averageByWorkforceRange: Map<CompanyWorkforceRange, PositiveNumber>;
  count: PositiveNumber;
  countByWorkforceRange: Map<CompanyWorkforceRange, PositiveNumber>;
  lastThreeYearsAverage: Map<PositiveNumber, PositiveNumber>;
};

export interface PublicStatsProps {
  balancedRepresentation: BalancedRepresentationStats;
  index: IndexStats;
  year: PositiveNumber;
}

export class PublicStats extends Entity<PublicStatsProps, never> {
  get year(): PositiveNumber {
    return this.props.year;
  }
  get balancedRepresentation(): BalancedRepresentationStats {
    return this.props.balancedRepresentation;
  }
  get index(): IndexStats {
    return this.props.index;
  }
}
