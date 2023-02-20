export interface paths {
  "/entreprise/{siren}": {
    /**
     * Recherche d'entreprise par SIREN
     * @description Recherche d'entreprise par numéro SIREN  (9 caractères)
     */
    get: operations["siren"];
  };
  "/etablissement/{siret}": {
    /**
     * Recherche d'entreprise par SIRET
     * @description Recherche d'entreprise par numéro SIRET
     */
    get: operations["siret"];
  };
  "/search": {
    /**
     * Recherche d'entreprise par nom
     * @description Recherche d'entreprise par nom d'établissement, raison sociale, siret, siren
     */
    get: operations["search"];
  };
}

export type webhooks = Record<string, never>;

export type components = Record<string, never>;

export type external = Record<string, never>;

export interface operations {
  /**
   * Recherche d'entreprise par nom
   * @description Recherche d'entreprise par nom d'établissement, raison sociale, siret, siren
   */
  search: {
    parameters: {
      query: {
        /**
         * @description Localisation de l'entreprise
         * @example Lyon
         */
        address?: string;
        /**
         * @description Retourne uniquement les établissements avec une convention collective déclarée
         * @example false
         */
        convention?: boolean;
        /**
         * @description Retourne uniquement les établissements avec des employés déclarés
         * @example false
         */
        employer?: boolean;
        /**
         * @description Nombre de résultats max
         * @example 100
         */
        limit?: number;
        /**
         * @description Nombre d'établissements connexes inclus dans la réponse, -1 pour tous les établissements
         * @example 100
         */
        matchingLimit?: number;
        /**
         * @description Retourne uniquement les établissements ouverts
         * @example false
         */
        open?: boolean;
        /**
         * @description Texte de la recherche
         * @example Michelin
         */
        query: string;
        /**
         * @description Si 'true', ordonne les résultats par taille d'établissement, basée sur la tranche effectif de l'unité légale. Si 'false', ordonné par SIRET décroissant.
         * @example true
         */
        ranked?: boolean;
      };
    };
    responses: {
      /** @description Unexpexted error occured */
      500: never;
    };
  };
  /**
   * Recherche d'entreprise par SIREN
   * @description Recherche d'entreprise par numéro SIREN  (9 caractères)
   */
  siren: {
    parameters: {
      path: {
        /**
         * @description Numéro de SIREN
         * @example 323841353
         */
        siren: string;
      };
    };
    responses: {
      /** @description Default response */
      default: never;
    };
  };
  /**
   * Recherche d'entreprise par SIRET
   * @description Recherche d'entreprise par numéro SIRET
   */
  siret: {
    parameters: {
      path: {
        /**
         * @description Numéro de SIRET (14 caractères)
         * @example 32384135300911
         */
        siret: string;
      };
    };
    responses: {
      /** @description Default response */
      default: never;
    };
  };
}
