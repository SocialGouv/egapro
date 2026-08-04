import path from "node:path";

export const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");
export const TEST_SIREN = "130025265";

// GIP-MDS annual average workforce of the test company. Every size-based rule reads this value,
// so the suite baseline is a >= 250 company: 6-step funnel (indicator G required) + CSE field.
export const TEST_GIP_WORKFORCE = 250;

// Phone number of the test user. A ProConnect sign-up never carries one, and since #3952 the
// funnel layout bounces to /mon-espace until it is known, so the suite seeds it as a baseline.
export const TEST_USER_PHONE = "0122334455";
