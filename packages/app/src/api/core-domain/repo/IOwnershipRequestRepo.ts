import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { Repo } from "@common/shared-domain";

/**
 * TODO
 *
 * Continuer avec l'implementation de createOwnershipRequest.
 *
 * Faire la migration en db pour ajouter la table.
 * Voir comment marche l'UUID.
 * Tester avec Postman.
 */

export type IOwnershipRequestRepo = Repo<OwnershipRequest>;
