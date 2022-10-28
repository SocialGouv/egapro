import type { COUNTIES, COUNTRIES, NAF, REGIONS } from "@common/dict";
import type { FormState } from "@services/apiClient";

export type RepartitionEquilibreeAPI = {
  data: RepartitionEquilibreeDataField;
  declared_at: number;
  modified_at: number;
  siren: string;
  year: number;
};

type Declarant = {
  email: string;
  nom: string;
  prénom: string;
  téléphone: string;
};

type Entreprise = {
  adresse: string;
  code_naf: keyof typeof NAF;
  code_pays?: keyof typeof COUNTRIES | undefined;
  code_postal?: string | undefined;
  commune: string;
  département: keyof typeof COUNTIES;
  raison_sociale: string;
  région: keyof typeof REGIONS;
  siren: string;
};

export type RepartitionEquilibreeDataField = {
  déclarant: Declarant;
  déclaration: DeclarationRepartitionEquilibree;
  entreprise: Entreprise;
  répartition_équilibrée: IndicateursRepartitionEquilibree;
};

type DeclarationRepartitionEquilibree = {
  année_indicateurs: number;
  fin_période_référence: string;
  publication?: PublicationRepartitionEquilibree | undefined;
};

type PublicationRepartitionEquilibree = {
  date: string;
  modalités?: string | undefined;
  url?: string | undefined;
};

export const motifNonCalculabiliteCadresOptions = [
  {
    label: "Aucun cadre dirigeant",
    value: "aucun_cadre_dirigeant",
  },
  {
    label: "Un seul cadre dirigeant",
    value: "un_seul_cadre_dirigeant",
  },
] as const;

export const motifNonCalculabiliteMembresOptions = [
  {
    label: "Aucune instance dirigeante",
    value: "aucune_instance_dirigeante",
  },
] as const;

type IndicateursRepartitionEquilibree = {
  motif_non_calculabilité_cadres: typeof motifNonCalculabiliteCadresOptions[number]["value"] | undefined;
  motif_non_calculabilité_membres: typeof motifNonCalculabiliteMembresOptions[number]["value"] | undefined;
  pourcentage_femmes_cadres: number;
  pourcentage_femmes_membres: number;
  pourcentage_hommes_cadres: number;
  pourcentage_hommes_membres: number;
};

// TODO: better assert for the state. For example, foreign society have a country code but no region, etc..
const assertValidFormState = (state: FormState): void => {
  const requiredValues = [
    state.year,
    state.endOfPeriod,
    state.declarant.email,
    state.declarant.nom,
    state.declarant.prenom,
    state.declarant.telephone,
    state.entreprise?.adresse,
    state.entreprise?.code_naf,
    // state.entreprise?.commune,
    // state.entreprise?.département,
    // state.entreprise?.région,
    state.entreprise?.raison_sociale,
    state.entreprise?.siren,
    state.motifEcartsCadresNonCalculable || (state.ecartsCadresFemmes && state.ecartsCadresHommes),
    state.motifEcartsMembresNonCalculable || (state.ecartsMembresFemmes && state.ecartsMembresHommes),
  ];

  requiredValues.map(value => {
    if (!value) throw new Error("Invalid Form State");
  });
};

/*
 * Transform the form data in repartition.
 *
 * @param state the state of the repartition (Form state)
 */
export const buildRepartition = (state: FormState): RepartitionEquilibreeDataField => {
  assertValidFormState(state);

  const déclarant: Declarant = {
    email: state.declarant.email,
    nom: state.declarant.nom,
    prénom: state.declarant.prenom,
    téléphone: state.declarant.telephone,
  };

  const publication: PublicationRepartitionEquilibree = {
    date: state.publishingDate as string, // todo: replace later with zod schema
    ...(!state.hasWebsite && { modalités: state.publishingContent }),
    ...(state.hasWebsite && { url: state.publishingWebsiteUrl }),
  };

  const déclaration: DeclarationRepartitionEquilibree = {
    année_indicateurs: state.year as number,
    fin_période_référence: state.endOfPeriod as string,
    ...((!state.motifEcartsCadresNonCalculable || !state.motifEcartsMembresNonCalculable) && { publication }),
  };

  const entreprise: Entreprise = {
    adresse: state.entreprise?.adresse as string,
    code_naf: state.entreprise?.code_naf as keyof typeof NAF,
    code_pays: state.entreprise?.code_pays as keyof typeof COUNTRIES,
    code_postal: state.entreprise?.code_postal,
    commune: state.entreprise?.commune as string,
    département: state.entreprise?.département as keyof typeof COUNTIES,
    raison_sociale: state.entreprise?.raison_sociale as string,
    région: state.entreprise?.région as keyof typeof REGIONS,
    siren: state.entreprise?.siren as string,
  };

  const répartition_équilibrée: IndicateursRepartitionEquilibree = {
    motif_non_calculabilité_cadres: state.motifEcartsCadresNonCalculable,
    motif_non_calculabilité_membres: state.motifEcartsMembresNonCalculable,
    pourcentage_femmes_cadres: state.ecartsCadresFemmes as number,
    pourcentage_hommes_cadres: state.ecartsCadresHommes as number,
    pourcentage_femmes_membres: state.ecartsMembresFemmes as number,
    pourcentage_hommes_membres: state.ecartsMembresHommes as number,
  };

  return { déclarant, déclaration, entreprise, répartition_équilibrée };
};
