import { type COUNTIES, type COUNTRIES, type NAF, type REGIONS } from "@common/dict";
import { type FormState } from "@services/apiClient";

export type RepresentationEquilibreeAPI = {
  data: RepresentationEquilibreeDataField;
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

export type Entreprise = {
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

export type RepresentationEquilibreeDataField = {
  déclarant: Declarant;
  déclaration: DeclarationRepresentationEquilibree;
  entreprise: Entreprise;
  indicateurs: { représentation_équilibrée: IndicateursRepresentationEquilibree };
};

type DeclarationRepresentationEquilibree = {
  année_indicateurs: number;
  date?: string;
  fin_période_référence: string;
  publication?: PublicationRepresentationEquilibree | undefined;
};

type PublicationRepresentationEquilibree = {
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

type IndicateursRepresentationEquilibree = {
  motif_non_calculabilité_cadres: (typeof motifNonCalculabiliteCadresOptions)[number]["value"] | undefined;
  motif_non_calculabilité_membres: (typeof motifNonCalculabiliteMembresOptions)[number]["value"] | undefined;
  pourcentage_femmes_cadres: number;
  pourcentage_femmes_membres: number;
  pourcentage_hommes_cadres: number;
  pourcentage_hommes_membres: number;
};

// TODO: better assert for the state. For example, foreign society have a country code but no region, etc..
export const assertValidFormState = (state: FormState): void => {
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
    state.motifEcartsCadresNonCalculable ||
      (state.ecartsCadresFemmes !== undefined && state.ecartsCadresHommes !== undefined),
    state.motifEcartsMembresNonCalculable ||
      (state.ecartsMembresFemmes !== undefined && state.ecartsMembresHommes !== undefined),
  ];

  requiredValues.map(value => {
    if (!value) throw new Error("Invalid Form State");
  });
};

/*
 * Transform the form data in representation.
 *
 * @param state the state of the representation (Form state)
 */
export const buildRepresentation = (state: FormState): RepresentationEquilibreeDataField => {
  assertValidFormState(state);

  const déclarant: Declarant = {
    email: state.declarant.email,
    nom: state.declarant.nom,
    prénom: state.declarant.prenom,
    téléphone: state.declarant.telephone,
  };

  const publication: PublicationRepresentationEquilibree = {
    date: state.publishingDate as string, // todo: replace later with zod schema
    ...(!state.hasWebsite && { modalités: state.publishingContent }),
    ...(state.hasWebsite && { url: state.publishingWebsiteUrl }),
  };

  const déclaration: DeclarationRepresentationEquilibree = {
    date: state.date,
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

  const représentation_équilibrée: IndicateursRepresentationEquilibree = {
    motif_non_calculabilité_cadres: state.motifEcartsCadresNonCalculable,
    motif_non_calculabilité_membres: state.motifEcartsMembresNonCalculable,
    pourcentage_femmes_cadres: state.ecartsCadresFemmes as number,
    pourcentage_hommes_cadres: state.ecartsCadresHommes as number,
    pourcentage_femmes_membres: state.ecartsMembresFemmes as number,
    pourcentage_hommes_membres: state.ecartsMembresHommes as number,
  };

  return { déclarant, déclaration, entreprise, indicateurs: { représentation_équilibrée } };
};

export const buildFormState = (declaration: RepresentationEquilibreeDataField): FormState => {
  const {
    déclarant,
    déclaration,
    entreprise,
    indicateurs: { représentation_équilibrée },
  } = declaration;

  const state = {} as Partial<FormState>;

  const declarant: FormState["declarant"] = {
    email: déclarant.email,
    nom: déclarant.nom,
    prenom: déclarant.prénom,
    telephone: déclarant.téléphone,
    accord_rgpd: true, // This data is not stored in DB but is implicitly true.
  };

  if (declaration.déclaration.date) state.date = declaration.déclaration.date;

  state.publishingDate = déclaration.publication?.date;
  state.publishingContent = déclaration.publication?.modalités;
  state.publishingWebsiteUrl = déclaration.publication?.url;
  state.hasWebsite = Boolean(state.publishingWebsiteUrl);

  state.year = déclaration.année_indicateurs;
  state.endOfPeriod = déclaration.fin_période_référence;

  state.motifEcartsCadresNonCalculable = représentation_équilibrée.motif_non_calculabilité_cadres;
  state.motifEcartsMembresNonCalculable = représentation_équilibrée.motif_non_calculabilité_membres;
  state.isEcartsCadresCalculable = state.motifEcartsCadresNonCalculable === undefined;
  state.isEcartsMembresCalculable = state.motifEcartsMembresNonCalculable === undefined;

  state.ecartsCadresFemmes = représentation_équilibrée.pourcentage_femmes_cadres;
  state.ecartsCadresHommes = représentation_équilibrée.pourcentage_hommes_cadres;
  state.ecartsMembresFemmes = représentation_équilibrée.pourcentage_femmes_membres;
  state.ecartsMembresHommes = représentation_équilibrée.pourcentage_hommes_membres;

  return {
    declarant,
    entreprise: entreprise as FormState["entreprise"],
    ...(state as Omit<FormState, "declarant" | "entreprise">),
  };
};
