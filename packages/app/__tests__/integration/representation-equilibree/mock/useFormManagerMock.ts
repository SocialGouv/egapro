/* eslint-disable @typescript-eslint/no-empty-function */
import { VALID_SIREN, VALID_SIREN2 } from "./user";

const useFormManagerCommon = {
  resetFormData: () => {},
  saveFormData: () => {},
};

export const validEnterprise = {
  adresse: "21 RUE JUMELLES",
  code_naf: "55.10Z",
  code_postal: "13016",
  commune: "MARSEILLE 16",
  département: "13",
  raison_sociale: "SAS BOULANGER",
  région: "93",
  siren: VALID_SIREN,
};

export const validEntreprise2 = {
  raison_sociale: "BOULANGERIES PAUL",
  code_naf: "10.71A",
  région: "32",
  département: "59",
  adresse: "BATIMENT D.E 344 AV DE LA MARNE",
  commune: "MARCQ-EN-BAROEUL",
  code_postal: "59700",
  siren: VALID_SIREN2,
};

export const useFormManagerMockValidData = () => {
  return {
    useFormManager: () => {
      return {
        ...useFormManagerCommon,
        formData: {
          entreprise: validEnterprise,
          year: 2021,
        },
      };
    },
  };
};

// used for publishing, validation and transmission pages tests
const formData = {
  declarant: {
    prenom: "test",
    nom: "test",
    telephone: "1234567890",
    email: "demo@travail.gouv.fr",
    accord_rgpd: true,
  },
  ecartsCadresFemmes: 3,
  ecartsCadresHommes: 97,
  ecartsMembresFemmes: 4,
  ecartsMembresHommes: 96,
  endOfPeriod: "2021-12-31",
  entreprise: validEntreprise2,
  hasWebsite: true,
  isEcartsCadresCalculable: true,
  isEcartsMembresCalculable: true,
  year: 2021,
};

export const useFormManagerMockPublishingPageData = () => {
  return {
    useFormManager: () => {
      return {
        ...useFormManagerCommon,
        formData,
      };
    },
  };
};

export const useFormManagerMockValidationPageData = () => {
  return {
    useFormManager: () => {
      return {
        ...useFormManagerCommon,
        formData: {
          ...formData,
          publishingDate: "2023-01-25",
          publishingWebsiteUrl: "test.com",
        },
      };
    },
  };
};

export const useFormManagerMockValidationPageDataNotCalculable = () => {
  return {
    useFormManager: () => {
      return {
        ...useFormManagerCommon,
        formData: {
          ...formData,
          isEcartsCadresCalculable: false,
          isEcartsMembresCalculable: false,
          ecartsCadresFemmes: undefined,
          ecartsCadresHommes: undefined,
          ecartsMembresFemmes: undefined,
          ecartsMembresHommes: undefined,
          motifEcartsCadresNonCalculable: "aucun_cadre_dirigeant",
          motifEcartsMembresNonCalculable: "aucune_instance_dirigeante",
        },
      };
    },
  };
};
