export type AdminDeclarationDTO = {
  createdAt: Date;
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
      ues?: {
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

export type OrderableColumn = Exclude<keyof typeof columnMap, "ues">;

export const orderableColumns = [
  "type",
  "siren",
  "year",
  "name",
  "createdAt",
  "declarantEmail",
  "declarantFirstName",
  "declarantLastName",
  "index",
] as const satisfies readonly OrderableColumn[];
