import { type CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";

interface RepresentationEquilibre30PercentWomenCount {
  /** Plus que 30% */
  gt: number;
  /** Moins ou égale à 30% */
  lte: number;
  /** Non calculable */
  nc: number;
}

export type PublicStatsDTO = {
  balancedRepresentation: {
    /** Nombre de répondants */
    count: number;
    /** Répartition des femmes dans les instances dirigeantes */
    countWomen30percentExecutives: RepresentationEquilibre30PercentWomenCount;
    /** Répartition des femmes parmi les cadres dirigeants */
    countWomen30percentMembers: RepresentationEquilibre30PercentWomenCount;
  };
  index: {
    average: number;
    averageByWorkforceRange: Record<CompanyWorkforceRange.Enum, number>;
    count: number;
    countByWorkforceRange: Record<CompanyWorkforceRange.Enum, number>;
    lastThreeYearsAverage: Record<number, number>;
  };
  year: number;
};
