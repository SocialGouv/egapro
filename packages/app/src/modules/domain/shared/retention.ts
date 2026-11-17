/**
 * Retention windows announced by the privacy policy.
 *
 * Single source: the `/donnees-personnelles` page displays them and the
 * scheduled purges apply them — changing a value here changes both at once.
 * Standalone scripts may override them through environment variables, never by
 * silent divergence.
 */

/** Account inactivity, counted from the last successful sign-in. */
export const USER_ACCOUNT_INACTIVITY_RETENTION_YEARS = 2;

/** Declaration retention (index and representation), in years. */
export const DECLARATION_RETENTION_YEARS = 6;
