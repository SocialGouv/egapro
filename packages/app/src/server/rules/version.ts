/**
 * The ruleset version in force, and the single place it is written down.
 *
 * Two consumers must agree on it, and used to hold their own copy of the
 * literal:
 *
 *  - `db/schema.ts` stamps it on every new declaration through the column
 *    default. Nothing else writes `rules_version`, so that default is the sole
 *    point where a declaration is bound to a ruleset.
 *  - `rules/nextSteps.ts` falls back to it when a stored version is not among
 *    the bundled ones — a rollback, or a row written by a newer deploy.
 *
 * Bumping one without the other would leave new declarations on the new graph
 * while the fallback silently resolved to the old one, with nothing to signal
 * it. Importing the same constant makes the two move together by construction.
 *
 * When adding a ruleset: register it in `BUNDLED_VERSIONS` (`engine.ts`), then
 * bump this constant. The test in `__tests__/nextSteps.test.ts` fails if it
 * names a version the engine cannot load.
 */
export const CURRENT_RULES_VERSION = "2027.1";
