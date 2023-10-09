export type AdminDeclarationDTO = {
  createdAt: string;
  declarantEmail: string;
  declarantFirstName: string;
  declarantLastName: string;
  name: string;
  siren: string;
  type: "index" | "repeq";
  year: number;
} & (
  | {
      index: number;
      type: "index";
      ues: {
        companies?: Array<{
          name: string;
          siren: string;
        }>;
        name: string;
      };
    }
  | {
      type: "repeq";
    }
);

export const columnMap = {
  type: "Type de déclaration",
  siren: "SIREN",
  year: "Année",
  name: "Raison sociale",
  createdAt: "Date de déclaration",
  declarantEmail: "Email du déclarant",
  declarantFirstName: "Prénom du déclarant",
  declarantLastName: "Nom du déclarant",
  index: "Index",
  ues: "UES",
} as const satisfies Record<keyof Exclude<AdminDeclarationDTO, { type: "repeq" }>, string>;
