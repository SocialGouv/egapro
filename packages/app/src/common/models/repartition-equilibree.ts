export type RepartitionEquilibreeAPI = {
  siren: string
  year: number
  data: RepartitionEqulibreeDataField
  modified_at: number
  declared_at: number
}

type Declarant = {
  prénom: string
  nom: string
  téléphone: string
  email: string
}

type Entreprise = {
  siren: string
  raison_sociale: string
  code_naf: string
  région: string
  département: string
  adresse: string
  code_postal?: string | undefined
  commune: string
  code_pays?: string | undefined
}

export type RepartitionEqulibreeDataField = {
  déclarant: Declarant
  entreprise: Entreprise
  déclaration: DeclarationRepartitionEquilibree
  indicateurs: IndicateursRepartitionEquilibree
  publication: PublicationRepartitionEquilibree
}

type DeclarationRepartitionEquilibree = {
  année_indicateurs: number
  fin_période_référence: Date
}

type PublicationRepartitionEquilibree = {
  date: string
  url?: string | undefined
  modalités?: string | undefined
}

type IndicateursRepartitionEquilibree = {
  pourcentage_femmes_cadres: number
  pourcentage_hommes_cadres: number
  pourcentage_femmes_membres: number
  pourcentage_hommes_membres: number
  motif_non_calculabilité_cadres: "Il n'y a aucun cadre dirigeant" | "Il n'y a qu'un seul cadre dirigeant" | undefined
  motif_non_calculabilité_membres: "Il n'y a aucune instance dirigeante" | undefined
}
