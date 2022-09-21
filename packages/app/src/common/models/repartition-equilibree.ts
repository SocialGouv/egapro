import { COUNTIES, COUNTRIES, NAF, REGIONS } from "../dict"

export type RepartitionEquilibreeAPI = {
  siren: string
  year: number
  data: RepartitionEquilibreeDataField
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
  code_naf: keyof typeof NAF
  région: keyof typeof REGIONS
  département: keyof typeof COUNTIES
  adresse: string
  code_postal?: string | undefined
  commune: string
  code_pays?: keyof typeof COUNTRIES | undefined
}

export type RepartitionEquilibreeDataField = {
  source: "répartition_équilibrée"
  déclarant: Declarant
  entreprise: Entreprise
  déclaration: DeclarationRepartitionEquilibree
  répartition_équilibrée: IndicateursRepartitionEquilibree
}

type DeclarationRepartitionEquilibree = {
  année_indicateurs: number
  fin_période_référence: Date
  publication: PublicationRepartitionEquilibree
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
  motif_non_calculabilité_cadres: "aucun_cadre_dirigeant" | "un_seul_cadre_dirigeant" | undefined
  motif_non_calculabilité_membres: "aucune_instance_dirigeante" | undefined
}
