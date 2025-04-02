import { ValidationError } from "@common/shared-domain/domain/ValidationError";
import { SimpleStringValueObject } from "@common/shared-domain/domain/valueObjects";

// French postal codes must be exactly 5 digits
const FRENCH_POSTAL_CODE_REGEX = /^\d{5}$/;
// For other countries, we're more permissive
const GENERIC_POSTAL_CODE_REGEX = /^[\w\d\s-]{1,10}$/;

export class FrenchPostalCode extends SimpleStringValueObject<FrenchPostalCode> {
  constructor(value: string, countryCode?: unknown) {
    if (!value) {
      throw new ValidationError(`"${value}" is not a valid postal code.`);
    }
    const cleanValue = value.trim();

    const isFrenchPostalCode = isFrenchCountryCode(countryCode);

    if (isFrenchPostalCode) {
      if (/^\d{4}$/.test(cleanValue)) {
        super(`0${cleanValue}`, FRENCH_POSTAL_CODE_REGEX);
        return;
      }

      super(cleanValue, FRENCH_POSTAL_CODE_REGEX);
    } else {
      super(cleanValue, GENERIC_POSTAL_CODE_REGEX);
    }
  }
}

/**
 * Helper function to determine if a country code represents France
 * Handles various formats of country code (string, object with getValue method, etc.)
 */
function isFrenchCountryCode(countryCode: unknown): boolean {
  if (countryCode === undefined || countryCode === null) {
    return true;
  }

  if (typeof countryCode === "string") {
    return countryCode === "FR";
  }

  if (typeof countryCode === "object" && countryCode !== null) {
    const stringValue = String(countryCode);
    if (stringValue === "FR") {
      return true;
    }

    const obj = countryCode as Record<string, unknown>;
    if ("getValue" in obj && typeof obj.getValue === "function") {
      const value = obj.getValue();
      return value === "FR";
    }
  }

  return false;
}
