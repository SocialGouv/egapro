// The session file lives in `helpers/login.ts` and nowhere else. A second `AUTH_FILE` used to
// sit here, pointing at `src/e2e/.auth/user.json` — a different path, imported by nothing, and
// exactly the kind of decoy someone reaches for by autocomplete. Removed rather than aligned:
// two constants for one file is how the sweep ends up authenticating against nothing.
export const TEST_SIREN = "130025265";

// GIP-MDS annual average workforce of the test company. Every size-based rule reads this value,
// so the suite baseline is a >= 250 company: 6-step funnel (indicator G required) + CSE field.
export const TEST_GIP_WORKFORCE = 250;

// Phone number of the test user. A ProConnect sign-up never carries one, and since #3952 the
// funnel layout bounces to /mon-espace until it is known, so the suite seeds it as a baseline.
export const TEST_USER_PHONE = "0122334455";

// Email of the ProConnect test identity (FIA1V2). The login helper types it in and the
// mail assertions filter MailDev on it: two copies of the literal, and the day the
// fixture account changes one of them keeps matching nothing while still passing.
export const TEST_USER_EMAIL = "test@fia1.fr";
