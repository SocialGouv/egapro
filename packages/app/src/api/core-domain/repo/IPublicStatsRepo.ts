import { type PublicStats } from "@common/core-domain/domain/PublicStats";

export interface IPublicStatsRepo {
  getAll(): Promise<PublicStats>;
}
