/**
 * Durées de conservation annoncées par la politique de confidentialité.
 *
 * Source unique : la page `/donnees-personnelles` les affiche, et les purges
 * planifiées les appliquent — modifier une valeur ici change les deux à la
 * fois. Les scripts autonomes peuvent les surcharger par variable
 * d'environnement, jamais en divergence silencieuse.
 */

/** Inactivité d'un compte utilisateur, à compter de sa dernière connexion. */
export const USER_ACCOUNT_INACTIVITY_RETENTION_YEARS = 2;

/** Conservation d'une déclaration (index et représentation), par année. */
export const DECLARATION_RETENTION_YEARS = 6;
