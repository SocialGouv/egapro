import { ensure } from "@common/utils/function";
import { type Any } from "@common/utils/types";
import { LRUCache } from "lru-cache";

import { type UseCase } from "./UseCase";

export interface CachedUseCaseOptions {
  /**
   * In seconds.
   * @default 30
   */
  revalidate?: number;
}

const GLOBAL_CACHE = new Map<string, LRUCache<string, Any>>();
const DEFAULT_KEY = "__default_key___";

/**
 * When extended, give cache capabilities with the stale-while-revalidate pattern.
 *
 * `run()` method must be implemented instead of `execute()` which will be implicitly implemented.
 *
 * Default revalidate is 30 seconds.
 */
export abstract class AbstractCachedUsedCase<TRequest extends object, TResponse extends object>
  implements UseCase<TRequest, TResponse>
{
  protected debug = false;
  protected abstract cacheMasterKey: string;
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: 30,
  };

  protected abstract run(request: TRequest): Promise<TResponse>;
  public async execute(request: TRequest, options = this.defaultOptions): Promise<TResponse> {
    const cache = this.getCache(options);
    const cacheKey = this.getCacheKey(request);
    const status: LRUCache.Status<TResponse> = {};
    const hasValue = cache.has(cacheKey, { status });

    if (!hasValue) {
      const pResult = this.run(request);
      if (status.has === "stale") {
        this.debug && console.info(`[Cache][${this.cacheMasterKey}] Cache hit but stale`, request);
        pResult.then(result => cache.set(cacheKey, result));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- cache hit
        return cache.get(cacheKey, { allowStale: true })!;
      }

      this.debug && console.info(`[Cache][${this.cacheMasterKey}] Cache miss`, request);
      return pResult.then(result => {
        cache.set(cacheKey, result);
        return result;
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- cache hit
    const result = cache.get(cacheKey)!;
    this.debug && console.info(`[Cache][${this.cacheMasterKey}] Cache hit`, { request, result });
    return result;
  }

  private getCacheKey(param: TRequest) {
    return ensure(() => JSON.stringify(param), DEFAULT_KEY);
  }

  private getCache({ revalidate = 30 } = this.defaultOptions) {
    if (!GLOBAL_CACHE.has(this.cacheMasterKey)) {
      GLOBAL_CACHE.set(
        this.cacheMasterKey,
        new LRUCache<string, TResponse>({
          max: 250,
          updateAgeOnGet: false,
          updateAgeOnHas: false,
          allowStale: false,
          ttl: 1000 * revalidate,
        }),
      );
    }
    return GLOBAL_CACHE.get(this.cacheMasterKey) as LRUCache<string, TResponse>;
  }
}
