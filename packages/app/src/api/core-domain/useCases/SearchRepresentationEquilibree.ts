import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchRepresentationEquilibreeInputDTO,
  type SearchRepresentationEquilibreeResultDTO,
} from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { LRUCache } from "lru-cache";

import { type IRepresentationEquilibreeSearchRepo } from "../repo/IRepresentationEquilibreeSearchRepo";

type Input = SearchRepresentationEquilibreeInputDTO;
type Output = ConsultationDTO<SearchRepresentationEquilibreeResultDTO>;
// TODO move as decorator or Trait
const cache = new LRUCache<string, Output>({
  max: 250,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
  allowStale: false,
  ttl: 1000 * 5, // revalidate 30s
});
export class SearchRepresentationEquilibree implements UseCase<Input, Output> {
  constructor(private readonly representationEquilibreeSearchRepo: IRepresentationEquilibreeSearchRepo) {}

  public async execute(criteria: Input): Promise<Output> {
    const cacheKey = JSON.stringify(criteria);
    const status: LRUCache.Status<Output> = {};
    const hasValue = cache.has(cacheKey, { status });
    // no cache or stale (ensure stale-while-revalidate)
    if (!hasValue) {
      try {
        const run = async () => {
          const count = await this.representationEquilibreeSearchRepo.count(criteria);
          const results = await this.representationEquilibreeSearchRepo.search(criteria);

          const data = results.map(representationEquilibreeSearchResultMap.toDTO);
          const result = {
            count,
            data,
          };
          cache.set(cacheKey, result);
          return result;
        };

        const pResult = run();
        if (status.has === "stale") {
          return cache.get(cacheKey, { allowStale: true }) ?? pResult;
        }
        return pResult;
      } catch (error: unknown) {
        console.error(error);
        throw new SearchRepresentationEquilibreeError("Cannot search représentation équilibrée", error as Error);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- cache hit
    return cache.get(cacheKey)!;
  }
}

export class SearchRepresentationEquilibreeError extends AppError {}
