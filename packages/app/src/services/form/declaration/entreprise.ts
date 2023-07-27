import {
  type CodeNaf,
  type CodePays,
  type DeclarationDTO,
  type Departement,
  type Region,
} from "@common/models/generated";

export type Entreprise = {
  adresse: string;
  codeNaf: CodeNaf;
  codePays?: CodePays;
  codePostal?: string;
  commune?: string;
  département?: Departement;
  raisonSociale: string;
  région?: Region;
  siren: string;
};

/**
 * Construct from the backend.
 */
export const buildEntreprise = (entreprise: DeclarationDTO["entreprise"]): Entreprise => {
  return {
    siren: entreprise.siren,
    adresse: entreprise.adresse || "",
    codeNaf: entreprise.code_naf,
    codePays: entreprise.code_pays,
    codePostal: entreprise.code_postal,
    commune: entreprise.commune,
    département: entreprise.département,
    raisonSociale: entreprise.raison_sociale,
    région: entreprise.région,
  };
};
