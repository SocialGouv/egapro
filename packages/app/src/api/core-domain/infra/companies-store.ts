import { logger } from "@api/utils/pino";
import * as crypto from "crypto";
export type Company = { label: string | null; siren: string };
/**
 * Utilities for hashing company data
 */
export const companiesUtils = {
  /**
   * Generate a hash for companies array
   * This hash will be stored in the JWT for reference
   */
  async hashCompanies(companies: Company[]): Promise<string> {
    try {
      if (!companies.length) return "";

      // Sort to ensure consistent hashing regardless of array order
      const sortedCompanies = [...companies].sort((a, b) => a.siren.localeCompare(b.siren));
      const companiesString = JSON.stringify(sortedCompanies);

      // Create SHA-256 hash
      const hash = crypto.createHash("sha256").update(companiesString).digest("hex");
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
};
