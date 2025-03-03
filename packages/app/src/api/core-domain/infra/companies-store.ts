import { logger } from "@api/utils/pino";
import * as argon2 from "argon2";
import Redis from "ioredis";

export type Company = { label: string | null; siren: string };

// Configure Redis connection based on environment variables or defaults
const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  keyPrefix: "egapro:",
  // Default TTL for keys (24 hours)
  // This ensures we don't keep unused data permanently
  maxTtl: 60 * 60 * 24,
};

// Create Redis client
const redisClient = new Redis(redisOptions);

// Log Redis connection errors but don't crash the application
redisClient.on("error", err => {
  logger.error("Redis client error", err);
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

      const hash = await argon2.hash(companiesString, {
        type: argon2.argon2id,
        memoryCost: 2048, // minimize memory usage for this simple hash
        timeCost: 3, // minimize time cost for this simple hash
        parallelism: 1, // minimize parallelism for this simple hash
      });

      // Store the actual companies data in Redis using the hash as key
      await this.storeCompaniesInRedis(hash, companies);

      return hash;
    } catch (error) {
      logger.error("Failed to hash companies", error);
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
      await redisClient.set(`companies:${hash}`, companiesString, "EX", redisOptions.maxTtl);

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

  /**
   * Verify that provided companies data matches the hash from JWT
   * This is used to verify client-submitted companies data
   */
  async verifyCompaniesData(companies: Company[], hash: string): Promise<boolean> {
    try {
      if (!companies.length || !hash) return false;

      // Sort to ensure consistent verification regardless of array order
      const sortedCompanies = [...companies].sort((a, b) => a.siren.localeCompare(b.siren));
      const companiesString = JSON.stringify(sortedCompanies);

      return await argon2.verify(hash, companiesString);
    } catch (error) {
      logger.error("Failed to verify companies data", error);
      return false;
    }
  },
};
