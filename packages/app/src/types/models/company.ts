export type TrancheType = "50:250" | "251:999" | "1000:"

export type CompanyType = {
  entreprise: {
    raison_sociale: string
    siren: string
    région: string
    département: string
    code_naf: string
    ues: { nom: string; entreprises: { raison_sociale: string; siren: string }[] }
    effectif: { tranche: TrancheType }
  }
  notes: Record<number, number>
  notes_remunerations: Record<number, number>
  notes_augmentations: Record<number, number>
  notes_promotions: Record<number, number>
  notes_augmentations_et_promotions: Record<number, number> // Uniquement pour les entreprise de 50 à 250.
  notes_conges_maternite: Record<number, number>
  notes_hautes_rémunérations: Record<number, number>
  label: string
}

export type CompaniesType = {
  data: CompanyType[]
  count: number
}
