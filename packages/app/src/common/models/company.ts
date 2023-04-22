export type TrancheType = "50:250" | "251:999" | "1000:";

//TODO : à refactorer avec des types francisées ??
export type CompanyType = {
  entreprise: {
    code_naf: string;
    département: string;
    effectif: { tranche: TrancheType };
    raison_sociale: string;
    région: string;
    siren: string;
    ues?: { entreprises: Array<{ raison_sociale: string; siren: string }>; nom: string };
  };
  label: string;
  notes: Record<number, number>;
  notes_augmentations: Record<number, number>;
  /** Uniquement pour les entreprise de 50 à 250. */
  notes_augmentations_et_promotions: Record<number, number>;
  notes_conges_maternite: Record<number, number>;
  notes_hautes_rémunérations: Record<number, number>;
  notes_promotions: Record<number, number>;
  notes_remunerations: Record<number, number>;
};

export type CompaniesType = {
  count: number;
  data: CompanyType[];
};
