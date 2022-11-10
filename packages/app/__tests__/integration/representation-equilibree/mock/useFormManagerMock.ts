/* eslint-disable no-unused-labels */
/* eslint-disable @typescript-eslint/no-empty-function */
import { VALID_SIREN } from "./user";

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

export const useFormManagerMock = () => {
  return {
    useFormManager: () => {
      return {
        saveFormData: () => {},
        formData: {},
      };
    },
  };
};

export const useFormManagerMockValidData = () => {
  return {
    useFormManager: () => {
      return {
        saveFormData: () => {},
        formData: {
          entreprise: validEnterprise,
          year: 2021,
        },
      };
    },
  };
};
