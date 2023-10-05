import { type DeclarationDTO } from "./DeclarationDTO";

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
        companies: Array<{
          name: string;
          siren: string;
        }>;
        name: string;
      };
    }
  | {
      type: DeclarationDTO["ues"];
    }
);
