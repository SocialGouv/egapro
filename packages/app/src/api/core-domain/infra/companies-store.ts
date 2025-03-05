import { logger } from "@api/utils/pino";
import * as crypto from "crypto";
import Redis, { type RedisOptions } from "ioredis";

export type Company = { label: string | null; siren: string };

// Configure Redis connection based on environment variables or defaults
const redisOptions: RedisOptions = {
  password: process.env.REDIS_PASSWORD,
};

if (process.env.REDIS_SENTINEL_HOSTS) {
  try {
    redisOptions.sentinels = JSON.parse(process.env.REDIS_SENTINEL_HOSTS);
  } catch (error) {
    logger.error({ error }, "Failed to parse REDIS_SENTINEL_HOSTS");
  }
} else {
  redisOptions.host = process.env.REDIS_HOST || "localhost";
  redisOptions.port = parseInt(process.env.REDIS_PORT || "6379", 10);
}

const maxTtl = 60 * 60 * 48;

// Create Redis client
const redisClient = new Redis(redisOptions);

// Log Redis connection errors but don't crash the application
redisClient.on("error", err => {
  logger.error(
    {
      err,
    },
    "Redis client error",
  );
});

/**
 * Utilities for hashing and storing company data using Redis
 */
export const companiesUtils = {
  /**
   * Generate a hash for companies array
   * This hash will be stored in the JWT for reference
   * The actual companies data will be stored in Redis using this hash as key
   */
  async hashCompanies(companies: Company[]): Promise<string> {
    try {
      if (!companies.length) return "";

      // Sort to ensure consistent hashing regardless of array order
      const sortedCompanies = [...companies].sort((a, b) => a.siren.localeCompare(b.siren));
      const companiesString = JSON.stringify(sortedCompanies);

      // Create SHA-256 hash
      const hash = crypto.createHash("sha256").update(companiesString).digest("hex");

      // Store the actual companies data in Redis using the hash as key
      await this.storeCompaniesInRedis(hash, companies);

      return hash;
    } catch (error) {
      logger.error(
        {
          error,
        },
        "Failed to hash companies",
      );
      return "";
    }
  },

  /**
   * Store companies data in Redis using the hash as key
   */
  async storeCompaniesInRedis(hash: string, companies: Company[]): Promise<void> {
    try {
      if (!companies.length || !hash) return;

      const companiesString = JSON.stringify(companies);
      await redisClient.set(`companies:${hash}`, companiesString, "EX", maxTtl);

      logger.info({ hash }, "Companies data stored in Redis");
    } catch (error) {
      logger.error({ error, hash }, "Failed to store companies in Redis");
    }
  },

  /**
   * Get companies data from Redis using the hash
   */
  async getCompaniesFromRedis(hash: string): Promise<Company[]> {
    try {
      if (!hash) return [];

      const companiesString = await redisClient.get(`companies:${hash}`);
      if (!companiesString) {
        logger.warn({ hash }, "Companies data not found in Redis");
        return [];
      }

      return JSON.parse(companiesString) as Company[];
    } catch (error) {
      logger.error({ error, hash }, "Failed to get companies from Redis");
      return [];
    }
  },
};
