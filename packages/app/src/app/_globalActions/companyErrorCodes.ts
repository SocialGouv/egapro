export enum CompanyErrorCodes {
  NOT_FOUND,
  CLOSED,
  UNKNOWN,
  ABORTED = 999,
}

export const CLOSED_COMPANY_ERROR = "Ce Siren correspond a une entreprise fermée. Veuillez vérifier votre saisie";
