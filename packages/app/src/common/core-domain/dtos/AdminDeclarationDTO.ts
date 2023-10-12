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
  type: "Type",
  siren: "SIREN",
  year: "Année",
  name: "Raison sociale",
  createdAt: "Date déclaration",
  declarantEmail: "Email",
  declarantFirstName: "Prénom",
  declarantLastName: "Nom",
  index: "Index",
  ues: "UES",
} as const satisfies Record<keyof Exclude<AdminDeclarationDTO, { type: "repeq" }>, string>;
